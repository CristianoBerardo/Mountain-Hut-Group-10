import { PoolClient } from "pg";
import { pool } from "../connections/PostgreSQL/database";
import { InvalidRequestError, NotFoundError } from "../errors/AppError";
import { CreateReservationDTO } from "../models/dto/ReservationDTO";
import { MealReservation } from "../models/MealReservation";
import { throwRepositoryError } from "./utils/repositoryErrors";

type TableRow = {
  dining_table_id: string;
  free: number;
};

type Assignment = {
  dining_table_id: string;
  seats_assigned: number;
};

function assignTables(tables: TableRow[], partySize: number): Assignment[] {
  const assignments: Assignment[] = [];

  // Try to seat the whole party at ONE table (smallest that fits)
  const singleTable = tables
    .filter((t) => Number(t.free) >= partySize)
    .sort((a, b) => Number(a.free) - Number(b.free)) // smallest sufficient first
    .at(0);

  if (singleTable) {
    assignments.push({
      dining_table_id: singleTable.dining_table_id,
      seats_assigned: partySize,
    });
  } else {
    // Greedy fill: tables sorted by free DESC
    let remaining = partySize;
    for (const t of tables) {
      if (remaining <= 0) break;
      const take = Math.min(Number(t.free), remaining);
      if (take > 0) {
        assignments.push({
          dining_table_id: t.dining_table_id,
          seats_assigned: take,
        });
        remaining -= take;
      }
    }
  }

  return assignments;
}

function isTwoHoursAhead(slotDate: string, slotStartsAt: string): boolean {
  // slotDate:    'YYYY-MM-DD'
  // slotStartsAt: 'HH:MM:SS' (as returned by pg) or 'HH:MM'
  const hhmm = slotStartsAt.slice(0, 5); // take only HH:MM
  const slotStart = new Date(`${slotDate}T${hhmm}:00Z`);
  const diffMs = slotStart.getTime() - Date.now();
  return diffMs >= 2 * 60 * 60 * 1000;
}

export class ReservationRepository {
  /** List reservations ordered by their start time. */
  public async getReservations(): Promise<MealReservation[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM meal_reservation ORDER BY starts_at ASC`,
      );
      if (result.rows.length === 0) {
        throw new NotFoundError("No reservations found");
      }
      return result.rows;
    } catch (error) {
      return throwRepositoryError(error, "Unable to retrieve reservations.");
    }
  }
  /** Retrieve a reservation together with its assigned tables. */
  public async getReservationById(
    id: string,
  ): Promise<MealReservation & { tables: Assignment[] }> {
    try {
      const result = await pool.query(
        `SELECT
         mr.*,
         COALESCE(
           json_agg(
             json_build_object(
               'dining_table_id', rt.dining_table_id,
               'seats_assigned',  rt.seats_assigned
             )
           ) FILTER (WHERE rt.dining_table_id IS NOT NULL),
           '[]'
         ) AS tables
       FROM meal_reservation mr
       LEFT JOIN reservation_table rt ON rt.reservation_id = mr.id
       WHERE mr.id = $1
       GROUP BY mr.id`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundError("Reservation not found");
      }
      return result.rows[0];
    } catch (error) {
      return throwRepositoryError(error, "Unable to retrieve the reservation.");
    }
  }
  /** Create a reservation and assign seats within one transaction. */
  public async createReservation({
    slot_id,
    party_size,
    hiker_id,
  }: CreateReservationDTO & { hiker_id: string }): Promise<{
    reservation: MealReservation;
    tables: Assignment[];
  }> {
    let client: PoolClient | undefined;
    let transactionStarted = false;
    if (!hiker_id) {
      throw new InvalidRequestError("hiker_id is required");
    }
    if (!slot_id) {
      throw new InvalidRequestError("slot_id is required");
    }
    if (!party_size || party_size <= 0) {
      throw new InvalidRequestError("party_size must be a positive integer");
    }
    try {
      client = await pool.connect();
      // Fetch slot
      const slotResult = await client.query(
        `SELECT id, date::text AS date, starts_at::text AS starts_at, ends_at::text AS ends_at
       FROM meal_slot WHERE id = $1`,
        [slot_id],
      );
      if (slotResult.rows.length === 0) {
        throw new NotFoundError("Slot not found");
      }
      const slot = slotResult.rows[0];
      //  2-hour rule
      if (!isTwoHoursAhead(slot.date, slot.starts_at)) {
        throw new InvalidRequestError(
          "Reservations must be made at least 2 hours in advance",
        );
      }
      // 1-per-slot rule — hiker cannot double-book
      const dupCheck = await client.query(
        `SELECT id FROM meal_reservation
       WHERE hiker_id = $1 AND slot_id = $2 AND status = 'CONFIRMED'`,
        [hiker_id, slot_id],
      );
      if (dupCheck.rows.length > 0) {
        throw new InvalidRequestError(
          "You already have a confirmed reservation for this slot",
        );
      }
      await client.query("BEGIN");
      transactionStarted = true;
      // lock slot_table rows + compute free seats per table to prevent Race cond.
      await client.query(
        `SELECT dining_table_id FROM slot_table WHERE slot_id = $1 FOR UPDATE`,
        [slot_id],
      );
      // Uses dt.capacity (seats_in_slot was removed from slot_table schema)
      const tableResult = await client.query<{
        dining_table_id: string;
        capacity: number;
        booked: number;
        free: number;
      }>(
        `SELECT
         st.dining_table_id,
         dt.capacity,
         COALESCE(SUM(rt.seats_assigned), 0)              AS booked,
         dt.capacity - COALESCE(SUM(rt.seats_assigned), 0) AS free
       FROM slot_table st
       JOIN dining_table dt ON dt.id = st.dining_table_id
       LEFT JOIN reservation_table rt
              ON rt.dining_table_id = st.dining_table_id
             AND rt.reservation_id IN (
                 SELECT id FROM meal_reservation
                 WHERE slot_id = $1 AND status = 'CONFIRMED'
             )
       WHERE st.slot_id = $1
         AND dt.is_active = TRUE
       GROUP BY st.dining_table_id, dt.capacity
       ORDER BY free DESC`,
        [slot_id],
      );
      const tables = tableResult.rows;
      const totalFree = tables.reduce((sum, t) => sum + Number(t.free), 0);
      if (totalFree < party_size) {
        throw new InvalidRequestError(
          "Not enough seats available for this slot",
        );
      }
      const assignments = assignTables(tables, party_size);
      // INSERT meal_reservation
      const hhmm_start = slot.starts_at.slice(0, 5);
      const hhmm_end = slot.ends_at.slice(0, 5);
      const reservationResult = await client.query<MealReservation>(
        `INSERT INTO meal_reservation
         (hiker_id, slot_id, party_size, starts_at, ends_at, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', NOW())
       RETURNING *`,
        [
          hiker_id,
          slot_id,
          party_size,
          `${slot.date}T${hhmm_start}:00Z`,
          `${slot.date}T${hhmm_end}:00Z`,
        ],
      );
      const reservation = reservationResult.rows[0];
      // INSERT reservation_table rows
      for (const a of assignments) {
        await client.query(
          `INSERT INTO reservation_table (reservation_id, dining_table_id, seats_assigned)
         VALUES ($1, $2, $3)`,
          [reservation.id, a.dining_table_id, a.seats_assigned],
        );
      }
      await client.query("COMMIT");
      transactionStarted = false;
      return { reservation, tables: assignments };
    } catch (error) {
      if (client && transactionStarted) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "Failed to roll back the reservation transaction:",
            rollbackError,
          );
        }
      }
      return throwRepositoryError(error, "Unable to create the reservation.");
    } finally {
      client?.release();
    }
  }
  /** Replace a reservation's table assignments and party size atomically. */
  public async updateReservation(
    id: string,
    party_size: number,
  ): Promise<{ reservation: MealReservation; tables: Assignment[] }> {
    let client: PoolClient | undefined;
    let transactionStarted = false;
    if (!party_size || party_size <= 0) {
      throw new InvalidRequestError("party_size must be a positive integer");
    }
    try {
      client = await pool.connect();
      // Fetch existing reservation + slot info
      const resResult = await client.query(
        `SELECT mr.*,
              ms.date::text       AS slot_date,
              ms.starts_at::text  AS slot_starts_at,
              ms.ends_at::text    AS slot_ends_at
       FROM meal_reservation mr
       JOIN meal_slot ms ON ms.id = mr.slot_id
       WHERE mr.id = $1 AND mr.status = 'CONFIRMED'`,
        [id],
      );
      if (resResult.rows.length === 0) {
        throw new NotFoundError("Reservation not found or not modifiable");
      }
      const existing = resResult.rows[0];
      // 2-hour rule
      if (!isTwoHoursAhead(existing.slot_date, existing.slot_starts_at)) {
        throw new InvalidRequestError(
          "Cannot modify reservation less than 2 hours before the slot",
        );
      }
      await client.query("BEGIN");
      transactionStarted = true;
      // Lock slot_table rows first to prevent race conditions
      await client.query(
        `SELECT dining_table_id FROM slot_table WHERE slot_id = $1 FOR UPDATE`,
        [existing.slot_id],
      );
      const tableResult = await client.query<{
        dining_table_id: string;
        capacity: number;
        booked: number;
        free: number;
      }>(
        `SELECT
         st.dining_table_id,
         dt.capacity,
         COALESCE(SUM(rt.seats_assigned), 0)              AS booked,
         dt.capacity - COALESCE(SUM(rt.seats_assigned), 0) AS free
       FROM slot_table st
       JOIN dining_table dt ON dt.id = st.dining_table_id
       LEFT JOIN reservation_table rt
              ON rt.dining_table_id = st.dining_table_id
             AND rt.reservation_id IN (
                 SELECT id FROM meal_reservation
                 WHERE slot_id = $1
                   AND status = 'CONFIRMED'
                   AND id != $2
             )
       WHERE st.slot_id = $1
         AND dt.is_active = TRUE
       GROUP BY st.dining_table_id, dt.capacity
       ORDER BY free DESC`,
        [existing.slot_id, id],
      );
      const tables = tableResult.rows;
      const totalFree = tables.reduce((sum, t) => sum + Number(t.free), 0);
      if (totalFree < party_size) {
        throw new InvalidRequestError(
          "Not enough seats available for the new party size",
        );
      }
      // Re-run table assignment
      const assignments = assignTables(tables, party_size);
      // Replace reservation_table rows
      await client.query(
        `DELETE FROM reservation_table WHERE reservation_id = $1`,
        [id],
      );
      for (const a of assignments) {
        await client.query(
          `INSERT INTO reservation_table (reservation_id, dining_table_id, seats_assigned)
         VALUES ($1, $2, $3)`,
          [id, a.dining_table_id, a.seats_assigned],
        );
      }
      // Update party_size on the reservation
      const updated = await client.query<MealReservation>(
        `UPDATE meal_reservation SET party_size = $1 WHERE id = $2 RETURNING *`,
        [party_size, id],
      );
      await client.query("COMMIT");
      transactionStarted = false;
      return { reservation: updated.rows[0], tables: assignments };
    } catch (error) {
      if (client && transactionStarted) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "Failed to roll back the reservation transaction:",
            rollbackError,
          );
        }
      }
      return throwRepositoryError(error, "Unable to update the reservation.");
    } finally {
      client?.release();
    }
  }
  /** Cancel a reservation and release its assigned seats atomically. */
  public async deleteReservation(id: string): Promise<{ message: string }> {
    let client: PoolClient | undefined;
    let transactionStarted = false;
    try {
      client = await pool.connect();
      // Fetch reservation + slot to check 2-hour rule
      const resResult = await client.query(
        `SELECT mr.*,
              ms.date::text       AS slot_date,
              ms.starts_at::text  AS slot_starts_at
       FROM meal_reservation mr
       JOIN meal_slot ms ON ms.id = mr.slot_id
       WHERE mr.id = $1 AND mr.status = 'CONFIRMED'`,
        [id],
      );
      if (resResult.rows.length === 0) {
        throw new NotFoundError("Reservation not found or already cancelled");
      }
      const reservation = resResult.rows[0];
      // 2-hour rule
      if (!isTwoHoursAhead(reservation.slot_date, reservation.slot_starts_at)) {
        throw new InvalidRequestError(
          "Cannot cancel reservation less than 2 hours before the slot",
        );
      }
      await client.query("BEGIN");
      transactionStarted = true;
      await client.query(
        `UPDATE meal_reservation SET status = 'CANCELLED' WHERE id = $1`,
        [id],
      );
      // Free the assigned table seats
      await client.query(
        `DELETE FROM reservation_table WHERE reservation_id = $1`,
        [id],
      );
      await client.query("COMMIT");
      transactionStarted = false;
      return { message: "Reservation cancelled successfully" };
    } catch (error) {
      if (client && transactionStarted) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "Failed to roll back the reservation transaction:",
            rollbackError,
          );
        }
      }
      return throwRepositoryError(error, "Unable to cancel the reservation.");
    } finally {
      client?.release();
    }
  }
}
