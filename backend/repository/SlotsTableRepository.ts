import { pool } from "../connections/PostgreSQL/database";
import { NotFoundError } from "../errors/AppError";
import { AvailableTableSlotDTO } from "../models/dto/AvailableTableSlotDTO";
import { throwRepositoryError } from "./utils/repositoryErrors";
import { TableAvailability } from "../types/reservationTypes";

interface SlotAvailabilityRow {
  available_times: string[];
  slot_id: string | null;
  table_id: string | null;
  table_number: number | null;
  capacity: number | null;
  booked_seats: number | null;
  free_seats: number | null;
}

interface SlotAvailability {
  available_times: string[];
  slot_id: string | null;
  tables: TableAvailability[];
}

export class SlotsTableRepository {
  /** Retrieve active tables and confirmed bookings for a date and start time. */
  public async getSlotAvailability(
    date: string,
    time: string,
  ): Promise<SlotAvailability> {
    try {
      const result = await pool.query<SlotAvailabilityRow>(
        `WITH day_slots AS (
           SELECT id, starts_at
           FROM meal_slot
           WHERE date = $1::date
         ),
         target_slot AS (
           SELECT id
           FROM day_slots
           WHERE starts_at = $2::time
           LIMIT 1
         ),
         booked AS (
           SELECT
             mr.slot_id,
             rt.dining_table_id,
             SUM(rt.seats_assigned)::INT AS booked_seats
           FROM reservation_table rt
           JOIN meal_reservation mr ON mr.id = rt.reservation_id
           WHERE mr.status = 'CONFIRMED'
             AND mr.slot_id IN (SELECT id FROM target_slot)
           GROUP BY mr.slot_id, rt.dining_table_id
         )
         SELECT
           COALESCE(
             (
               SELECT array_agg(to_char(starts_at, 'HH24:MI') ORDER BY starts_at)
               FROM day_slots
             ),
             ARRAY[]::text[]
           ) AS available_times,
           target_slot.id AS slot_id,
           dt.id AS table_id,
           dt.table_number,
           dt.capacity,
           COALESCE(booked.booked_seats, 0)::INT AS booked_seats,
           GREATEST(
             dt.capacity - COALESCE(booked.booked_seats, 0), 0
           )::INT AS free_seats
         FROM (SELECT 1) AS seed
         LEFT JOIN target_slot ON TRUE
         LEFT JOIN slot_table st ON st.slot_id = target_slot.id
         LEFT JOIN dining_table dt
                ON dt.id = st.dining_table_id
               AND dt.is_active = TRUE
         LEFT JOIN booked
           ON booked.slot_id = target_slot.id
          AND booked.dining_table_id = dt.id
         ORDER BY dt.table_number ASC`,
        [date, time],
      );

      return {
        available_times: result.rows[0].available_times,
        slot_id: result.rows[0].slot_id,
        tables: result.rows.flatMap((row) => {
          if (
            row.table_id === null ||
            row.table_number === null ||
            row.capacity === null ||
            row.booked_seats === null ||
            row.free_seats === null
          ) {
            return [];
          }

          return [
            {
              tableId: row.table_id,
              tableNumber: Number(row.table_number),
              totalCapacity: Number(row.capacity),
              occupiedSeats: Number(row.booked_seats),
              freeSeats: Number(row.free_seats),
            },
          ];
        }),
      };
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to check table availability. Please try again later.",
      );
    }
  }

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
