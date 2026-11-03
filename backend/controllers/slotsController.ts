import { Request, Response } from "express";
import { pool } from "../connections/PostgreSQL/database";
import { MealSlot } from "../models/MealSlot";

export async function getSlots(req: Request, res: Response): Promise<void> {
  try {
    const query = `SELECT * FROM meal_slot ORDER BY created_at ASC`;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving meal slots:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getSlotById(req: Request, res: Response): Promise<void> {
  try {
    const slotId = req.params.id;
    const query = `SELECT * FROM meal_slot WHERE id = $1`;
    const result = await pool.query(query, [slotId]);

    if (result.rows.length === 0) {
      console.error("Error retrieving meal_slot by ID: Slot not found");
      res.status(404).json({ error: "Slot not found" });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error retrieving meal_slot by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// // ! is not an meal_slot ma slot_table
// export async function getAvailableSlot(req: Request, res: Response) {
//   try {
//     const query = `SELECT
//   ms.id AS slot_id, ms.date, ms.starts_at, ms.ends_at,
//   COALESCE(SUM(st.seats_in_slot), 0)               AS total_seats,
//   COALESCE(SUM(rt.seats_assigned), 0)               AS booked_seats,
//   COALESCE(SUM(st.seats_in_slot), 0)
//     - COALESCE(SUM(rt.seats_assigned), 0)           AS available_seats
// FROM meal_slot ms
// LEFT JOIN slot_table st ON st.slot_id = ms.id
// LEFT JOIN reservation_table rt ON rt.dining_table_id = st.dining_table_id
//   AND rt.reservation_id IN (
//       SELECT id FROM meal_reservation
//       WHERE slot_id = ms.id AND status = 'CONFIRMED'
//   )
// WHERE ms.date = $1   -- optional filter
// GROUP BY ms.id
// ORDER BY ms.date, ms.starts_at;`;

//     if (query.length === 0) {
//       res.status(404).json({ error: "No available slots found" });
//       return;
//     }

//     const result = await pool.query(query, [req.query.date]);

//     res.status(200).json(result.rows);
//   } catch (error) {
//     console.error("Error retrieving available slots:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

export async function createMealSlot(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const mealSlot: Omit<MealSlot, "id"> = {
      ...req.body,
    };

    const result = await pool.query(
      `INSERT INTO meal_slot (date, starts_at, ends_at, created_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        mealSlot.date,
        mealSlot.starts_at,
        mealSlot.ends_at,
        new Date().toISOString(),
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteSlot(req: Request, res: Response): Promise<void> {
  try {
    const slotId = req.params.id;
    const result = await pool.query(`DELETE FROM meal_slot WHERE id = $1`, [
      slotId,
    ]);

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
): Promise<void> {}

export async function removeTableFromSlot(
  req: Request,
  res: Response,
): Promise<void> {}
