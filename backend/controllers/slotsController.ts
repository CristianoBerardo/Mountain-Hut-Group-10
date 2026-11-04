import { Request, Response } from "express";
import { pool } from "../connections/PostgreSQL/database";
import { MealSlot } from "../models/MealSlot";

export async function getMealSlots(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT * FROM meal_slot ORDER BY created_at ASC`,
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving meal slots:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMealSlotById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const slotId = req.params.id;
    const result = await pool.query(`SELECT * FROM meal_slot WHERE id = $1`, [
      slotId,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Slot not found" });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error retrieving meal_slot by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMealSlotDetails(
  req: Request,
  res: Response,
): Promise<void> {
  const slotId = req.params.id;
  try {
    const slotResult = await pool.query(
      `SELECT * FROM meal_slot WHERE id = $1`,
      [slotId],
    );
    if (slotResult.rows.length === 0) {
      res.status(404).json({ error: "Slot not found" });
      return;
    }

    const tablesResult = await pool.query(
      `SELECT
           dt.id,
           dt.table_number,
           dt.capacity,
           COALESCE(booked.booked_seats, 0)::INT                        AS booked_seats,
           (dt.capacity - COALESCE(booked.booked_seats, 0))::INT        AS available_seats
       FROM slot_table st
       JOIN dining_table dt ON dt.id = st.dining_table_id
       LEFT JOIN (
           SELECT rt.dining_table_id, SUM(rt.seats_assigned)::INT AS booked_seats
           FROM reservation_table rt
           JOIN meal_reservation mr ON mr.id = rt.reservation_id
           WHERE mr.slot_id = $1 AND mr.status = 'CONFIRMED'
           GROUP BY rt.dining_table_id
       ) booked ON booked.dining_table_id = dt.id
       WHERE st.slot_id = $1
       ORDER BY dt.table_number ASC`,
      [slotId],
    );

    res.status(200).json({
      slot: slotResult.rows[0],
      tables: tablesResult.rows,
    });
  } catch (error) {
    console.error("Error retrieving slot details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createMealSlot(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const mealSlot: Omit<MealSlot, "id"> = {
      ...req.body,
    };

    if (!mealSlot.date || !mealSlot.starts_at || !mealSlot.ends_at) {
      res
        .status(400)
        .json({ error: "date, starts_at and ends_at are required" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO meal_slot (date, starts_at, ends_at, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [mealSlot.date, mealSlot.starts_at, mealSlot.ends_at],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    const obj = error as { code: string };

    if (obj.code === "23505") {
      res.status(409).json({ error: "Slot already exists" });
      return;
    }

    console.error("Error creating slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteMealSlot(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const slotId = req.params.id;
    const result = await pool.query(
      `DELETE FROM meal_slot WHERE id = $1 RETURNING id`,
      [slotId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Slot not found" });
      return;
    }

    res.status(200).json({ message: "Slot deleted successfully" });
  } catch (error) {
    console.error("Error deleting slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addTableToSlot(
  req: Request,
  res: Response,
): Promise<void> {
  const slotId = req.params.id;
  const { dining_table_id }: { dining_table_id: string } = req.body;

  if (!dining_table_id) {
    res.status(400).json({ error: "dining_table_id is required" });
    return;
  }

  try {
    // Verify slot exists
    const slotCheck = await pool.query(
      `SELECT id FROM meal_slot WHERE id = $1`,
      [slotId],
    );
    if (slotCheck.rows.length === 0) {
      res.status(404).json({ error: "Slot not found" });
      return;
    }

    // Verify table exists and is active
    const tableCheck = await pool.query(
      `SELECT id FROM dining_table WHERE id = $1 AND is_active = TRUE`,
      [dining_table_id],
    );
    if (tableCheck.rows.length === 0) {
      res.status(404).json({ error: "Table not found or inactive" });
      return;
    }

    // Insert (idempotent via ON CONFLICT DO NOTHING)
    await pool.query(
      `INSERT INTO slot_table (slot_id, dining_table_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [slotId, dining_table_id],
    );

    res.status(201).json({
      message: "Table added to slot",
      slot_id: slotId,
      dining_table_id,
    });
  } catch (error) {
    console.error("Error adding table to slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function removeTableFromSlot(
  req: Request,
  res: Response,
): Promise<void> {
  const slotId = req.params.id;
  const tableId = req.params.tableId;

  try {
    // Rejected if active reservations exist for this table on this slot
    const reservationCheck = await pool.query(
      `SELECT rt.reservation_id
       FROM reservation_table rt
       JOIN meal_reservation mr ON mr.id = rt.reservation_id
       WHERE mr.slot_id = $1
         AND rt.dining_table_id = $2
         AND mr.status = 'CONFIRMED'
       LIMIT 1`,
      [slotId, tableId],
    );
    if (reservationCheck.rows.length > 0) {
      res.status(409).json({
        error:
          "Cannot remove table: active reservations exist on this table for this slot",
      });
      return;
    }

    const result = await pool.query(
      `DELETE FROM slot_table
       WHERE slot_id = $1 AND dining_table_id = $2
       RETURNING *`,
      [slotId, tableId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Table not associated with this slot" });
      return;
    }

    res.status(200).json({ message: "Table removed from slot" });
  } catch (error) {
    console.error("Error removing table from slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
