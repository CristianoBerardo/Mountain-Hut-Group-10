import { pool } from "../connections/PostgreSQL/database";
import { NotFoundError } from "../errors/AppError";
import { AvailableTableSlotDTO } from "../models/dto/AvailableTableSlotDTO";
import { throwRepositoryError } from "./utils/repositoryErrors";

export class SlotsTableRepository {
  /** Retrieve slots configured with active dining tables and their seat counts. */
  public async getAvailableSlot(): Promise<AvailableTableSlotDTO[]> {
    try {
      // Derive booked seats from confirmed reservations for each slot and table.
      // The shared dining_table.occupancy value is not used for slot availability.
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

      const result = await pool.query<AvailableTableSlotDTO>(query);

      if (result.rows.length === 0) {
        throw new NotFoundError(
          "No meal slots with active dining tables were found.",
        );
      }

      return result.rows;
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to retrieve available meal slots. Please try again later.",
      );
    }
  }
}
