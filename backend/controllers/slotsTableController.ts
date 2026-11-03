import { Request, Response } from "express";
import { pool } from "../connections/PostgreSQL/database";


// GET /api/v1/slots/available
// Returns all slots that have at least one active table configured,
// with available seats calculated on-the-fly from reservation_table
// (NOT from the stale dining_table.occupancy field).
export async function getAvailableSlot(req: Request, res: Response) {
  try {
    const query = `
      SELECT
          ms.id                                                           AS slot_id,
          ms.date,
          ms.starts_at,
          ms.ends_at,
          COUNT(DISTINCT st.dining_table_id)::INT                        AS active_tables_count,
          COALESCE(SUM(dt.capacity), 0)::INT                             AS total_capacity,
          COALESCE(SUM(COALESCE(booked.booked_seats, 0)), 0)::INT        AS total_booked,
          COALESCE(
            SUM(dt.capacity - COALESCE(booked.booked_seats, 0)), 0
          )::INT                                                         AS available_seats,
          json_agg(
              json_build_object(
                  'id',              dt.id,
                  'table_number',    dt.table_number,
                  'capacity',        dt.capacity,
                  'booked_seats',    COALESCE(booked.booked_seats, 0),
                  'available_seats', dt.capacity - COALESCE(booked.booked_seats, 0)
              )
              ORDER BY dt.table_number ASC
          )                                                              AS dining_tables
      FROM meal_slot ms
      INNER JOIN slot_table st   ON st.slot_id = ms.id
      INNER JOIN dining_table dt ON dt.id = st.dining_table_id
                                 AND dt.is_active = TRUE
      LEFT JOIN (
          -- Compute booked seats per (slot, dining_table) from confirmed reservations only
          SELECT
              mr.slot_id,
              rt.dining_table_id,
              SUM(rt.seats_assigned)::INT AS booked_seats
          FROM reservation_table rt
          JOIN meal_reservation mr ON mr.id = rt.reservation_id
          WHERE mr.status = 'CONFIRMED'
          GROUP BY mr.slot_id, rt.dining_table_id
      ) booked ON booked.slot_id = ms.id
             AND booked.dining_table_id = dt.id
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
