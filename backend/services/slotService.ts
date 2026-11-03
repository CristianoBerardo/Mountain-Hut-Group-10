import { PoolClient } from "pg";
import { pool } from "../connections/PostgreSQL/database";
import { CreateSlotInputDTO, SlotDetailsResponse, SlotTableAssignmentDTO } from "../models/dto/SlotDTO";
import { isValidDateString, validateFlexibleTimes } from "../utils/slotValidation";

export class SlotBusinessError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "SlotBusinessError";
    }
}

export async function createSlotWithCapacity(
    dto: CreateSlotInputDTO
): Promise<SlotDetailsResponse> {
    if (!isValidDateString(dto.date)) {
        throw new SlotBusinessError(400, "Date must be a valid format (YYYY-MM-DD).");
    }

    try {
        validateFlexibleTimes(dto.starts_at, dto.ends_at);
    } catch (err: any) {
        if (err.message === "START_TIME_MUST_BE_BEFORE_END_TIME") {
            throw new SlotBusinessError(400, "Start time must be strictly before end time.");
        }
        throw new SlotBusinessError(400, "Invalid start or end time format (expected HH:mm).");
    }

    const client: PoolClient = await pool.connect();

    try {
        await client.query("BEGIN");

        // Verifica sovrapposizione con altri slot nello stesso giorno
        const overlapQuery = `
      SELECT id FROM meal_slot
      WHERE date = $1::date
        AND starts_at < $3::time
        AND ends_at > $2::time
      LIMIT 1
    `;
        const overlapRes = await client.query(overlapQuery, [
            dto.date,
            dto.starts_at,
            dto.ends_at,
        ]);

        if (overlapRes.rows.length > 0) {
            throw new SlotBusinessError(409, "A meal slot already overlaps this time window on this date.");
        }

        //duplicare una configurazione da uno slot precedente 
        let tablesToAssign: SlotTableAssignmentDTO[] = [];

        if (dto.copy_from_slot_id) {
            const previousConfigQuery = `
        SELECT st.dining_table_id, st.seats_in_slot
        FROM slot_table st
        JOIN meal_slot ms ON ms.id = st.slot_id
        WHERE ms.id = $1
      `;
            const prevRes = await client.query(previousConfigQuery, [dto.copy_from_slot_id]);

            if (prevRes.rows.length === 0) {
                throw new SlotBusinessError(404, "Previous slot not found or has no table configurations to copy.");
            }

            tablesToAssign = prevRes.rows.map((r) => ({
                dining_table_id: r.dining_table_id,
                seats_in_slot: r.seats_in_slot,
            }));
        } else if (dto.tables && dto.tables.length > 0) {
            tablesToAssign = dto.tables;
        } else {
            throw new SlotBusinessError(400, "You must provide either a list of tables or a copy_from_slot_id.");
        }

        const tableIds = tablesToAssign.map((t) => t.dining_table_id);
        if (new Set(tableIds).size !== tableIds.length) {
            throw new SlotBusinessError(400, "Duplicate table detected in slot assignment.");
        }

        const physicalTablesRes = await client.query(
            `SELECT id, table_number, capacity, is_active 
       FROM dining_table 
       WHERE id = ANY($1::uuid[])`,
            [tableIds]
        );

        if (physicalTablesRes.rows.length !== tableIds.length) {
            throw new SlotBusinessError(404, "One or more specified dining tables do not exist.");
        }

        const physicalMap = new Map(physicalTablesRes.rows.map((row) => [row.id, row]));

        for (const t of tablesToAssign) {
            const physical = physicalMap.get(t.dining_table_id);
            if (!physical) continue;

            if (!physical.is_active) {
                throw new SlotBusinessError(400, `Dining table #${physical.table_number} is currently inactive.`);
            }

            if (!t.seats_in_slot || t.seats_in_slot <= 0) {
                throw new SlotBusinessError(400, `Seats in slot for table #${physical.table_number} must be greater than zero.`);
            }

            if (t.seats_in_slot > physical.capacity) {
                throw new SlotBusinessError(
                    400,
                    `Seats in slot (${t.seats_in_slot}) cannot exceed physical capacity (${physical.capacity}) for table #${physical.table_number}.`
                );
            }
        }

        const slotInsertQuery = `
      INSERT INTO meal_slot (date, starts_at, ends_at)
      VALUES ($1, $2, $3)
      RETURNING id, date, starts_at, ends_at, created_at
    `;
        const slotRes = await client.query(slotInsertQuery, [
            dto.date,
            dto.starts_at,
            dto.ends_at,
        ]);
        const newSlot = slotRes.rows[0];

        // Inserimento configurazione posti per ciascun tavolo
        for (const t of tablesToAssign) {
            await client.query(
                `INSERT INTO slot_table (slot_id, dining_table_id, seats_in_slot)
         VALUES ($1, $2, $3)`,
                [newSlot.id, t.dining_table_id, t.seats_in_slot]
            );
        }

        await client.query("COMMIT");

        const totalSeats = tablesToAssign.reduce((sum, t) => sum + t.seats_in_slot, 0);

        return {
            id: newSlot.id,
            date: newSlot.date,
            starts_at: newSlot.starts_at,
            ends_at: newSlot.ends_at,
            created_at: newSlot.created_at,
            total_seats: totalSeats,
            tables: tablesToAssign.map((t) => {
                const physical = physicalMap.get(t.dining_table_id)!;
                return {
                    dining_table_id: t.dining_table_id,
                    table_number: physical.table_number,
                    capacity: physical.capacity,
                    seats_in_slot: t.seats_in_slot,
                };
            }),
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}