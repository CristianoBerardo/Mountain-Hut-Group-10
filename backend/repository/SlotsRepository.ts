import { pool } from "../connections/PostgreSQL/database";
import {
  ConflictError,
  InvalidRequestError,
  NotFoundError,
} from "../errors/AppError";
import { AvailableDiningTableDTO } from "../models/dto/AvailableTableSlotDTO";
import { MealSlotDTO } from "../models/dto/MealSlotDTO";
import { throwRepositoryError } from "./utils/repositoryErrors";

export class SlotsRepository {
  /** List meal slots in creation order. */
  public async getMealSlots(): Promise<MealSlotDTO[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM meal_slot ORDER BY created_at ASC`,
      );
      return result.rows;
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to retrieve meal slots.",
        "Slot already exists",
      );
    }
  }
  /** Retrieve a meal slot by its database ID. */
  public async getMealSlotById(slotId: string): Promise<MealSlotDTO> {
    try {
      const result = await pool.query(`SELECT * FROM meal_slot WHERE id = $1`, [
        slotId,
      ]);
      if (result.rows.length === 0) {
        throw new NotFoundError("Slot not found");
      }
      return result.rows[0];
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to retrieve the meal slot.",
        "Slot already exists",
      );
    }
  }
  /** Retrieve a slot and its table capacities and confirmed bookings. */
  public async getMealSlotDetails(
    slotId: string,
  ): Promise<{ slot: MealSlotDTO; tables: AvailableDiningTableDTO[] }> {
    try {
      const slotResult = await pool.query(
        `SELECT * FROM meal_slot WHERE id = $1`,
        [slotId],
      );
      if (slotResult.rows.length === 0) {
        throw new NotFoundError("Slot not found");
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
      return {
        slot: slotResult.rows[0],
        tables: tablesResult.rows,
      };
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to retrieve meal slot details.",
        "Slot already exists",
      );
    }
  }
  /** Create a meal slot with its configured date and time range. */
  public async createMealSlot(
    mealSlot: Pick<MealSlotDTO, "date" | "starts_at" | "ends_at">,
  ): Promise<MealSlotDTO> {
    try {
      if (!mealSlot.date || !mealSlot.starts_at || !mealSlot.ends_at) {
        throw new InvalidRequestError(
          "date, starts_at and ends_at are required",
        );
      }
      const result = await pool.query(
        `INSERT INTO meal_slot (date, starts_at, ends_at, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
        [mealSlot.date, mealSlot.starts_at, mealSlot.ends_at],
      );
      return result.rows[0];
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to create the meal slot.",
        "Slot already exists",
      );
    }
  }
  /** Delete an existing meal slot. */
  public async deleteMealSlot(slotId: string): Promise<{ message: string }> {
    try {
      const result = await pool.query(
        `DELETE FROM meal_slot WHERE id = $1 RETURNING id`,
        [slotId],
      );
      if (result.rowCount === 0) {
        throw new NotFoundError("Slot not found");
      }
      return { message: "Slot deleted successfully" };
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to delete the meal slot.",
        "Slot already exists",
      );
    }
  }
  /** Assign an active dining table to a meal slot idempotently. */
  public async addTableToSlot(
    slotId: string,
    dining_table_id: string,
  ): Promise<{ message: string; slot_id: string; dining_table_id: string }> {
    if (!dining_table_id) {
      throw new InvalidRequestError("dining_table_id is required");
    }
    try {
      // Verify slot exists
      const slotCheck = await pool.query(
        `SELECT id FROM meal_slot WHERE id = $1`,
        [slotId],
      );
      if (slotCheck.rows.length === 0) {
        throw new NotFoundError("Slot not found");
      }
      // Verify table exists and is active
      const tableCheck = await pool.query(
        `SELECT id FROM dining_table WHERE id = $1 AND is_active = TRUE`,
        [dining_table_id],
      );
      if (tableCheck.rows.length === 0) {
        throw new NotFoundError("Table not found or inactive");
      }
      // Insert (idempotent via ON CONFLICT DO NOTHING)
      await pool.query(
        `INSERT INTO slot_table (slot_id, dining_table_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
        [slotId, dining_table_id],
      );
      return {
        message: "Table added to slot",
        slot_id: slotId,
        dining_table_id,
      };
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to assign the dining table to the meal slot.",
        "Slot already exists",
      );
    }
  }
  /** Remove a table only when it has no confirmed bookings in the slot. */
  public async removeTableFromSlot(
    slotId: string,
    tableId: string,
  ): Promise<{ message: string }> {
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
        throw new ConflictError(
          "Cannot remove table: active reservations exist on this table for this slot",
        );
      }
      const result = await pool.query(
        `DELETE FROM slot_table
       WHERE slot_id = $1 AND dining_table_id = $2
       RETURNING *`,
        [slotId, tableId],
      );
      if (result.rowCount === 0) {
        throw new NotFoundError("Table not associated with this slot");
      }
      return { message: "Table removed from slot" };
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to remove the dining table from the meal slot.",
        "Slot already exists",
      );
    }
  }
}
