import { Request, Response } from "express";
import { pool } from "../connections/PostgreSQL/database";
import { CreateReservationDTO } from "../models/dto/ReservationDTO";
import { MealReservation } from "../models/MealReservation";

export async function getReservations(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const query = `SELECT * FROM meal_reservation ORDER BY starts_at ASC`;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "No reservations found" });
      return;
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving reservations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createReservation(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const mealReservation: Omit<MealReservation, "id"> = {
      ...req.body,
    };

    const result = await pool.query(
      `INSERT INTO meal_reservation (hiker_id, starts_at, ends_at, slot_id, party_size, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        mealReservation.hiker_id,
        mealReservation.starts_at,
        mealReservation.ends_at,
        mealReservation.slot_id,
        mealReservation.party_size,
        mealReservation.status,
        new Date().toISOString(),
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createReservationV2(
  req: Request,
  res: Response,
): Promise<void> {
  const { slot_id, party_size, hiker_id }: CreateReservationDTO & { hiker_id: string } =
    req.body;

  if (!slot_id) {
    res.status(400).json({ error: "slot_id is required" });
    return;
  }
  if (!party_size || party_size <= 0) {
    res.status(400).json({ error: "party_size must be a positive integer" });
    return;
  }

  const client = await pool.connect();
  try {
    const slotResult = await client.query(
      `SELECT id, date, starts_at, ends_at FROM meal_slot WHERE id = $1`,
      [slot_id],
    );
    if (slotResult.rows.length === 0) {
      res.status(404).json({ error: "Slot not found" });
      return;
    }
    const slot = slotResult.rows[0];

    // ── Step 3: 2-hour rule ──────────────────────────────────────────────
    // Combine slot.date ('YYYY-MM-DD') + slot.starts_at ('HH:MM') into a timestamp
    const slotStart = new Date(`${slot.date}T${slot.starts_at}:00`);
    const now = new Date();
    const diffMs = slotStart.getTime() - now.getTime();
    const twoHoursMs = 2 * 60 * 60 * 1000;
    if (diffMs < twoHoursMs) {
      res
        .status(400)
        .json({ error: "Reservations must be made at least 2 hours in advance" });
      return;
    }

    // ── Step 4: 1-per-slot rule — hiker cannot double-book ───────────────
    const dupCheck = await client.query(
      `SELECT id FROM meal_reservation
       WHERE hiker_id = $1 AND slot_id = $2 AND status = 'CONFIRMED'`,
      [hiker_id, slot_id],
    );
    if (dupCheck.rows.length > 0) {
      res
        .status(400)
        .json({ error: "You already have a confirmed reservation for this slot" });
      return;
    }

    // ── Step 5–11: Transaction ────────────────────────────────────────────
    await client.query("BEGIN");

    // ── Step 6: Lock slot_table rows to prevent race conditions ──────────
    // ── Step 7: Compute free seats per table ─────────────────────────────
    const tableResult = await client.query<{
      dining_table_id: string;
      seats_in_slot: number;
      booked: number;
      free: number;
    }>(
      `SELECT
         st.dining_table_id,
         st.seats_in_slot,
         COALESCE(SUM(rt.seats_assigned), 0)                              AS booked,
         st.seats_in_slot - COALESCE(SUM(rt.seats_assigned), 0)          AS free
       FROM slot_table st
       LEFT JOIN reservation_table rt
              ON rt.dining_table_id = st.dining_table_id
             AND rt.reservation_id IN (
                 SELECT id FROM meal_reservation
                 WHERE slot_id = $1 AND status = 'CONFIRMED'
             )
       WHERE st.slot_id = $1
       GROUP BY st.dining_table_id, st.seats_in_slot
       ORDER BY free DESC
       FOR UPDATE OF st`,
      [slot_id],
    );

    const tables = tableResult.rows;
    const totalFree = tables.reduce((sum, t) => sum + Number(t.free), 0);

    if (totalFree < party_size) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "Not enough seats available" });
      return;
    }

    // ── Step 8: Table assignment algorithm ───────────────────────────────
    type Assignment = { dining_table_id: string; seats_assigned: number };
    const assignments: Assignment[] = [];

    // 8a. Try to seat everyone on ONE table (smallest table that fits)
    const singleTable = tables
      .filter((t) => Number(t.free) >= party_size)
      .sort((a, b) => Number(a.free) - Number(b.free)) // smallest sufficient first
      .at(0);

    if (singleTable) {
      assignments.push({
        dining_table_id: singleTable.dining_table_id,
        seats_assigned: party_size,
      });
    } else {
      // 8b. Greedy fill: tables already sorted by free DESC
      let remaining = party_size;
      for (const t of tables) {
        if (remaining <= 0) break;
        const take = Math.min(Number(t.free), remaining);
        if (take > 0) {
          assignments.push({ dining_table_id: t.dining_table_id, seats_assigned: take });
          remaining -= take;
        }
      }
    }

    // ── Step 9: INSERT meal_reservation ──────────────────────────────────
    const reservationResult = await client.query<MealReservation>(
      `INSERT INTO meal_reservation
         (hiker_id, slot_id, party_size, starts_at, ends_at, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', NOW())
       RETURNING *`,
      [hiker_id, slot_id, party_size, slot.starts_at, slot.ends_at],
    );
    const reservation = reservationResult.rows[0];

    // ── Step 10: INSERT reservation_table rows ────────────────────────────
    for (const a of assignments) {
      await client.query(
        `INSERT INTO reservation_table (reservation_id, dining_table_id, seats_assigned)
         VALUES ($1, $2, $3)`,
        [reservation.id, a.dining_table_id, a.seats_assigned],
      );
    }

    // ── Step 11: COMMIT ───────────────────────────────────────────────────
    await client.query("COMMIT");

    // ── Step 12: Return reservation with assigned tables ─────────────────
    res.status(201).json({ reservation, tables: assignments });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating reservation:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

export async function deleteReservation(
  req: Request,
  res: Response,
): Promise<void> {
  const reservationId = req.params.id;

  try {
    const result = await pool.query(
      `DELETE FROM meal_reservation WHERE id = $1 RETURNING *`,
      [reservationId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    res.status(200).json({ message: "Reservation deleted successfully" });
  } catch (error) {
    console.error("Error deleting reservation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
