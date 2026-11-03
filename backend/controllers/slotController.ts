import { Request, Response } from "express";
import type { PoolClient } from "pg";
import { pool } from "../connections/PostgreSQL/database";
import { runInTransaction } from "../utils/databaseTransaction";
import {
  isPositiveInteger,
  isUuid,
  isValidDate,
  isValidTime,
} from "../utils/slotValidation";

interface SlotTableInput {
  dining_table_id: string;
  seats_in_slot: number;
}

function timeInSeconds(value: string): number {
  const [hoursPart, minutesPart, secondsPart = "0"] = value.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  const seconds = Number(secondsPart);
  return hours * 3600 + minutes * 60 + seconds;
}

function isSlotTableInput(value: unknown): value is SlotTableInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const table = value as Record<string, unknown>;
  return (
    isUuid(table.dining_table_id) &&
    isPositiveInteger(table.seats_in_slot) &&
    table.seats_in_slot <= 32767
  );
}

async function getSlotWithTables(
  client: Pick<PoolClient, "query">,
  id: string,
) {
  const slotResult = await client.query(
    `SELECT
       ms.id, ms.date, ms.starts_at, ms.ends_at, ms.created_at,
       COALESCE(capacity.total_seats, 0)::int AS total_seats
     FROM meal_slot ms
     LEFT JOIN (
       SELECT slot_id, SUM(seats_in_slot) AS total_seats
       FROM slot_table
       GROUP BY slot_id
     ) capacity ON capacity.slot_id = ms.id
     WHERE ms.id = $1`,
    [id],
  );

  if (slotResult.rows.length === 0) {
    return null;
  }

  const tablesResult = await client.query(
    `SELECT
       st.dining_table_id, dt.table_number, dt.capacity, st.seats_in_slot
     FROM slot_table st
     JOIN dining_table dt ON dt.id = st.dining_table_id
     WHERE st.slot_id = $1
     ORDER BY dt.table_number`,
    [id],
  );

  return { ...slotResult.rows[0], tables: tablesResult.rows };
}

export async function getSlots(req: Request, res: Response): Promise<void> {
  try {
    const date = req.query.date;
    if (date !== undefined && !isValidDate(date)) {
      res.status(400).json({ error: "date must be a valid YYYY-MM-DD date" });
      return;
    }

    const result = await pool.query(
      `SELECT
         ms.id AS slot_id, ms.date, ms.starts_at, ms.ends_at,
         COALESCE(capacity.total_seats, 0)::int AS total_seats
       FROM meal_slot ms
       LEFT JOIN (
         SELECT slot_id, SUM(seats_in_slot) AS total_seats
         FROM slot_table
         GROUP BY slot_id
       ) capacity ON capacity.slot_id = ms.id
       WHERE ($1::date IS NULL OR ms.date = $1::date)
       ORDER BY ms.date, ms.starts_at`,
      [date ?? null],
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving meal slots:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getSlotById(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!isUuid(id)) {
    res.status(400).json({ error: "Invalid slot id" });
    return;
  }

  try {
    const slot = await getSlotWithTables(pool, id);
    if (!slot) {
      res.status(404).json({ error: "Meal slot not found" });
      return;
    }
    res.status(200).json(slot);
  } catch (error) {
    console.error("Error retrieving meal slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createSlot(
  req: Request,
  res: Response,
): Promise<void> {
  const { date, starts_at, ends_at, tables } = req.body;

  if (
    !isValidDate(date) ||
    !isValidTime(starts_at) ||
    !isValidTime(ends_at) ||
    timeInSeconds(starts_at) >= timeInSeconds(ends_at)
  ) {
    res.status(400).json({
      error: "A valid date, starts_at and ends_at are required",
    });
    return;
  }

  if (!Array.isArray(tables) || !tables.every(isSlotTableInput)) {
    res.status(400).json({
      error: "tables must be an array of table ids and positive seat counts",
    });
    return;
  }

  const tableIds = tables.map((table: SlotTableInput) => table.dining_table_id);
  if (new Set(tableIds).size !== tableIds.length) {
    res.status(400).json({ error: "A table can only be assigned once per slot" });
    return;
  }

  try {
    const slot = await runInTransaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(621038, hashtext($1))", [
        date,
      ]);

      const overlap = await client.query(
        `SELECT id
         FROM meal_slot
         WHERE date = $1::date
           AND starts_at < $3::time
           AND ends_at > $2::time
         LIMIT 1`,
        [date, starts_at, ends_at],
      );
      if (overlap.rows.length > 0) {
        return { conflict: "A meal slot already overlaps this time window" };
      }

      if (tables.length > 0) {
        const diningTables = await client.query(
          `SELECT id, capacity, is_active
           FROM dining_table
           WHERE id = ANY($1::uuid[])
           FOR SHARE`,
          [tableIds],
        );

        if (diningTables.rows.length !== tables.length) {
          return { invalid: "One or more dining tables do not exist" };
        }

        const tableById = new Map(
          diningTables.rows.map((table) => [table.id, table]),
        );
        for (const table of tables as SlotTableInput[]) {
          const diningTable = tableById.get(table.dining_table_id);
          if (!diningTable?.is_active) {
            return { invalid: "All assigned dining tables must be active" };
          }
          if (table.seats_in_slot > diningTable.capacity) {
            return {
              invalid: "seats_in_slot cannot exceed the dining table capacity",
            };
          }
        }
      }

      const created = await client.query(
        `INSERT INTO meal_slot (date, starts_at, ends_at)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [date, starts_at, ends_at],
      );
      const slotId = created.rows[0].id as string;

      for (const table of tables as SlotTableInput[]) {
        await client.query(
          `INSERT INTO slot_table (slot_id, dining_table_id, seats_in_slot)
           VALUES ($1, $2, $3)`,
          [slotId, table.dining_table_id, table.seats_in_slot],
        );
      }

      return { slot: await getSlotWithTables(client, slotId) };
    });

    if ("conflict" in slot) {
      res.status(409).json({ error: slot.conflict });
      return;
    }
    if ("invalid" in slot) {
      res.status(400).json({ error: slot.invalid });
      return;
    }
    res.status(201).json(slot.slot);
  } catch (error) {
    console.error("Error creating meal slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteSlot(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!isUuid(id)) {
    res.status(400).json({ error: "Invalid slot id" });
    return;
  }

  try {
    const result = await runInTransaction(async (client) => {
      const slot = await client.query(
        "SELECT id FROM meal_slot WHERE id = $1 FOR UPDATE",
        [id],
      );
      if (slot.rows.length === 0) {
        return "not-found";
      }

      await client.query("DELETE FROM meal_slot WHERE id = $1", [id]);
      return "deleted";
    });

    if (result === "not-found") {
      res.status(404).json({ error: "Meal slot not found" });
      return;
    }
    res.status(200).json({ message: "Meal slot deleted successfully" });
  } catch (error) {
    console.error("Error deleting meal slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addSlotTable(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  const { dining_table_id, seats_in_slot } = req.body;

  if (
    !isUuid(id) ||
    !isUuid(dining_table_id) ||
    !isPositiveInteger(seats_in_slot) ||
    seats_in_slot > 32767
  ) {
    res.status(400).json({ error: "Invalid slot table assignment" });
    return;
  }

  try {
    const result = await runInTransaction(async (client) => {
      const slot = await client.query(
        "SELECT id FROM meal_slot WHERE id = $1 FOR UPDATE",
        [id],
      );
      if (slot.rows.length === 0) {
        return { status: "slot-not-found" as const };
      }

      const tableResult = await client.query(
        "SELECT capacity, is_active FROM dining_table WHERE id = $1 FOR SHARE",
        [dining_table_id],
      );
      if (tableResult.rows.length === 0) {
        return { status: "table-not-found" as const };
      }
      const diningTable = tableResult.rows[0];
      if (!diningTable.is_active) {
        return { status: "table-inactive" as const };
      }
      if (seats_in_slot > diningTable.capacity) {
        return { status: "capacity-exceeded" as const };
      }

      await client.query(
        `INSERT INTO slot_table (slot_id, dining_table_id, seats_in_slot)
         VALUES ($1, $2, $3)
         ON CONFLICT (slot_id, dining_table_id)
         DO UPDATE SET seats_in_slot = EXCLUDED.seats_in_slot`,
        [id, dining_table_id, seats_in_slot],
      );
      return {
        status: "updated" as const,
        slot: await getSlotWithTables(client, id),
      };
    });

    switch (result.status) {
      case "slot-not-found":
        res.status(404).json({ error: "Meal slot not found" });
        return;
      case "table-not-found":
        res.status(404).json({ error: "Dining table not found" });
        return;
      case "table-inactive":
        res.status(400).json({ error: "Dining table is inactive" });
        return;
      case "capacity-exceeded":
        res.status(400).json({
          error: "seats_in_slot cannot exceed the dining table capacity",
        });
        return;
      default:
        res.status(200).json(result.slot);
    }
  } catch (error) {
    console.error("Error assigning dining table to meal slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function removeSlotTable(
  req: Request,
  res: Response,
): Promise<void> {
  const { id, tableId } = req.params;
  if (!isUuid(id) || !isUuid(tableId)) {
    res.status(400).json({ error: "Invalid slot or table id" });
    return;
  }

  try {
    const result = await runInTransaction(async (client) => {
      const slot = await client.query(
        "SELECT id FROM meal_slot WHERE id = $1 FOR UPDATE",
        [id],
      );
      if (slot.rows.length === 0) {
        return "slot-not-found";
      }

      const deleted = await client.query(
        "DELETE FROM slot_table WHERE slot_id = $1 AND dining_table_id = $2",
        [id, tableId],
      );
      return deleted.rowCount === 0 ? "table-not-found" : "deleted";
    });

    if (result === "slot-not-found") {
      res.status(404).json({ error: "Meal slot not found" });
      return;
    }
    if (result === "table-not-found") {
      res.status(404).json({ error: "Table is not assigned to this slot" });
      return;
    }
    res.status(200).json({ message: "Dining table removed from meal slot" });
  } catch (error) {
    console.error("Error removing dining table from meal slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
