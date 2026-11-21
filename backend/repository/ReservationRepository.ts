import { PoolClient } from "pg";
import { pool } from "../connections/PostgreSQL/database";
import { InvalidRequestError, NotFoundError } from "../errors/AppError";
import { MealReservation } from "../models/dto/MealReservation";
import { CreateReservationDTO } from "../models/dto/ReservationDTO";
import { throwRepositoryError } from "./utils/repositoryErrors";

type TableRow = {
  dining_table_id: string;
  table_number: number;
  free: number;
};

type ReservationRow = Omit<MealReservation, "starts_at" | "ends_at">;

type SlotTimes = {
  meal_slot_date: string;
  meal_slot_starts_at: string;
  meal_slot_ends_at: string;
};

function toMealReservation(row: ReservationRow & SlotTimes): MealReservation {
  const {
    meal_slot_date,
    meal_slot_starts_at,
    meal_slot_ends_at,
    ...reservation
  } = row;

  // Preserve the UTC convention used by the booking checks and email controller.
  return {
    ...reservation,
    starts_at: new Date(
      `${meal_slot_date}T${meal_slot_starts_at}Z`,
    ).toISOString(),
    ends_at: new Date(`${meal_slot_date}T${meal_slot_ends_at}Z`).toISOString(),
  };
}

type Assignment = {
  dining_table_id: string;
  table_number: number;
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
      table_number: singleTable.table_number,
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
          table_number: t.table_number,
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
      const result = await pool.query<ReservationRow & SlotTimes>(
        `SELECT mr.*,
                ms.date::text AS meal_slot_date,
                ms.starts_at::text AS meal_slot_starts_at,
                ms.ends_at::text AS meal_slot_ends_at
          FROM meal_reservation mr
          JOIN meal_slot ms ON ms.id = mr.meal_slot_id
          ORDER BY ms.date ASC, ms.starts_at ASC`,
      );
      if (result.rows.length === 0) {
        throw new NotFoundError("No reservations found");
      }
      return result.rows.map(toMealReservation);
    } catch (error) {
      return throwRepositoryError(error, "Unable to retrieve reservations.");
    }
  }
  /** Retrieve a reservation together with its assigned tables. */
  public async getReservationById(
    id: string,
  ): Promise<MealReservation & { tables: Assignment[] }> {
    try {
      // Define the expected shape of each query result row:
      // reservation data, slot date/time fields, and assigned tables.
      // This provides TypeScript type checking, not runtime validation.
      const result = await pool.query<
        ReservationRow & SlotTimes & { tables: Assignment[] }
      >(
        `SELECT
         mr.*,
         ms.date::text AS meal_slot_date,
         ms.starts_at::text AS meal_slot_starts_at,
         ms.ends_at::text AS meal_slot_ends_at,
         COALESCE(
           json_agg(
             json_build_object(
               'dining_table_id', rt.dining_table_id,
               'table_number',    dt.table_number,
               'seats_assigned',  rt.seats_assigned
             )
           ) FILTER (WHERE rt.dining_table_id IS NOT NULL),
           '[]'
         ) AS tables
       FROM meal_reservation mr
       JOIN meal_slot ms ON ms.id = mr.meal_slot_id
       LEFT JOIN reservation_table rt ON rt.meal_reservation_id = mr.id
       LEFT JOIN dining_table dt ON dt.id = rt.dining_table_id
       WHERE mr.id = $1
       GROUP BY mr.id, ms.id`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundError("Reservation not found");
      }
      return {
        ...toMealReservation(result.rows[0]),
        tables: result.rows[0].tables,
      };
    } catch (error) {
      return throwRepositoryError(error, "Unable to retrieve the reservation.");
    }
  }
  /** Create a reservation and assign seats within one transaction. */
  public async createReservation({
    meal_slot_id,
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
    if (!meal_slot_id) {
      throw new InvalidRequestError("meal_slot_id is required");
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
        [meal_slot_id],
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
       WHERE hiker_id = $1 AND meal_slot_id = $2 AND status = 'CONFIRMED'`,
        [hiker_id, meal_slot_id],
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
        `SELECT dining_table_id FROM slot_table WHERE meal_slot_id = $1 FOR UPDATE`,
        [meal_slot_id],
      );
      // Uses dt.capacity (seats_in_slot was removed from slot_table schema)
      const tableResult = await client.query<{
        dining_table_id: string;
        table_number: number;
        capacity: number;
        booked: number;
        free: number;
      }>(
        `SELECT
         st.dining_table_id,
         dt.table_number,
         dt.capacity,
         COALESCE(SUM(rt.seats_assigned), 0)              AS booked,
         dt.capacity - COALESCE(SUM(rt.seats_assigned), 0) AS free
       FROM slot_table st
       JOIN dining_table dt ON dt.id = st.dining_table_id
       LEFT JOIN reservation_table rt
              ON rt.dining_table_id = st.dining_table_id
             AND rt.meal_reservation_id IN (
                 SELECT id FROM meal_reservation
                 WHERE meal_slot_id = $1 AND status = 'CONFIRMED'
             )
       WHERE st.meal_slot_id = $1
         AND dt.is_active = TRUE
       GROUP BY st.dining_table_id, dt.table_number, dt.capacity
       ORDER BY free DESC`,
        [meal_slot_id],
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
      const reservationResult = await client.query<ReservationRow>(
        `INSERT INTO meal_reservation
         (hiker_id, meal_slot_id, party_size, status, created_at)
       VALUES ($1, $2, $3, 'CONFIRMED', NOW())
       RETURNING *`,
        [hiker_id, meal_slot_id, party_size],
      );
      const reservation = toMealReservation({
        ...reservationResult.rows[0],
        meal_slot_date: slot.date,
        meal_slot_starts_at: slot.starts_at,
        meal_slot_ends_at: slot.ends_at,
      });
      // INSERT reservation_table rows
      for (const a of assignments) {
        await client.query(
          `INSERT INTO reservation_table (meal_reservation_id, dining_table_id, seats_assigned)
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
      const resResult = await client.query<ReservationRow & SlotTimes>(
        `SELECT mr.*,
              ms.date::text       AS meal_slot_date,
              ms.starts_at::text  AS meal_slot_starts_at,
              ms.ends_at::text    AS meal_slot_ends_at
       FROM meal_reservation mr
       JOIN meal_slot ms ON ms.id = mr.meal_slot_id
       WHERE mr.id = $1 AND mr.status = 'CONFIRMED'`,
        [id],
      );
      if (resResult.rows.length === 0) {
        throw new NotFoundError("Reservation not found or not modifiable");
      }
      const existing = resResult.rows[0];
      // 2-hour rule
      if (
        !isTwoHoursAhead(existing.meal_slot_date, existing.meal_slot_starts_at)
      ) {
        throw new InvalidRequestError(
          "Cannot modify reservation less than 2 hours before the slot",
        );
      }
      await client.query("BEGIN");
      transactionStarted = true;
      // Lock slot_table rows first to prevent race conditions
      await client.query(
        `SELECT dining_table_id FROM slot_table WHERE meal_slot_id = $1 FOR UPDATE`,
        [existing.meal_slot_id],
      );
      const tableResult = await client.query<{
        dining_table_id: string;
        table_number: number;
        capacity: number;
        booked: number;
        free: number;
      }>(
        `SELECT
         st.dining_table_id,
         dt.table_number,
         dt.capacity,
         COALESCE(SUM(rt.seats_assigned), 0)              AS booked,
         dt.capacity - COALESCE(SUM(rt.seats_assigned), 0) AS free
       FROM slot_table st
       JOIN dining_table dt ON dt.id = st.dining_table_id
       LEFT JOIN reservation_table rt
              ON rt.dining_table_id = st.dining_table_id
             AND rt.meal_reservation_id IN (
                 SELECT id FROM meal_reservation
                 WHERE meal_slot_id = $1
                   AND status = 'CONFIRMED'
                   AND id != $2
             )
       WHERE st.meal_slot_id = $1
         AND dt.is_active = TRUE
       GROUP BY st.dining_table_id, dt.table_number, dt.capacity
       ORDER BY free DESC`,
        [existing.meal_slot_id, id],
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
        `DELETE FROM reservation_table WHERE meal_reservation_id = $1`,
        [id],
      );
      for (const a of assignments) {
        await client.query(
          `INSERT INTO reservation_table (meal_reservation_id, dining_table_id, seats_assigned)
         VALUES ($1, $2, $3)`,
          [id, a.dining_table_id, a.seats_assigned],
        );
      }
      // Update party_size on the reservation
      const updated = await client.query<ReservationRow>(
        `UPDATE meal_reservation SET party_size = $1 WHERE id = $2 RETURNING *`,
        [party_size, id],
      );
      await client.query("COMMIT");
      transactionStarted = false;
      return {
        reservation: toMealReservation({
          ...updated.rows[0],
          meal_slot_date: existing.meal_slot_date,
          meal_slot_starts_at: existing.meal_slot_starts_at,
          meal_slot_ends_at: existing.meal_slot_ends_at,
        }),
        tables: assignments,
      };
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
              ms.date::text       AS meal_slot_date,
              ms.starts_at::text  AS meal_slot_starts_at
       FROM meal_reservation mr
       JOIN meal_slot ms ON ms.id = mr.meal_slot_id
       WHERE mr.id = $1 AND mr.status = 'CONFIRMED'`,
        [id],
      );
      if (resResult.rows.length === 0) {
        throw new NotFoundError("Reservation not found or already cancelled");
      }
      const reservation = resResult.rows[0];
      // 2-hour rule
      if (
        !isTwoHoursAhead(
          reservation.meal_slot_date,
          reservation.meal_slot_starts_at,
        )
      ) {
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
        `DELETE FROM reservation_table WHERE meal_reservation_id = $1`,
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
