import { Request, Response } from "express";
import { pool } from "../connections/PostgreSQL/database";

export async function getAvailableSlot(req: Request, res: Response) {
  try {
    const query = `
      SELECT 
          ms.id AS slot_id,
          ms.date,
          ms.starts_at,
          ms.ends_at,
          COUNT(dt.id) AS active_tables_count,
          COALESCE(SUM(dt.capacity), 0)::INT AS total_capacity,
          COALESCE(SUM(dt.occupancy), 0)::INT AS total_occupancy,
          COALESCE(SUM(dt.capacity - dt.occupancy), 0)::INT AS available_seats,
          json_agg(
              json_build_object(
                  'id', dt.id,
                  'table_number', dt.table_number,
                  'capacity', dt.capacity,
                  'occupancy', dt.occupancy,
                  'available_seats', (dt.capacity - dt.occupancy)
              )
          ) AS dining_tables
      FROM meal_slot ms
      INNER JOIN slot_table st ON ms.id = st.slot_id
      INNER JOIN dining_table dt ON st.dining_table_id = dt.id
      WHERE dt.is_active = TRUE
      GROUP BY ms.id, ms.date, ms.starts_at, ms.ends_at
      ORDER BY ms.date ASC, ms.starts_at ASC;
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "No available slots found" });
      return;
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving available slots:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
