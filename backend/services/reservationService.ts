import { PoolClient } from "pg";
import { pool } from "../connections/PostgreSQL/database";
import {
    CreateMealReservationDTO,
    MealReservationResponse,
} from "../types/reservationTypes";
import { assignTablesToParty } from "../utils/tableAssignment";
import { getTablesAvailability } from "./tableAvailabilityService";

export class ReservationBusinessError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "ReservationBusinessError";
    }
}

export async function createReservation(
    dto: CreateMealReservationDTO
): Promise<MealReservationResponse> {
    //Validazione party size
    if (!dto.partySize || dto.partySize <= 0) {
        throw new ReservationBusinessError(400, "Party size must be greater than zero.");
    }

    //Calcolo orari
    const startsAt = new Date(dto.startsAt);
    if (isNaN(startsAt.getTime())) {
        throw new ReservationBusinessError(400, "Invalid start date/time format.");
    }

    //default 120 min se non specificato
    const endsAt = dto.endsAt
        ? new Date(dto.endsAt)
        : new Date(startsAt.getTime() + 120 * 60 * 1000);

    if (endsAt <= startsAt) {
        throw new ReservationBusinessError(400, "End time must be after start time.");
    }

    //Vincolo 2 ore prima
    const now = new Date();
    const diffHours = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 2) {
        throw new ReservationBusinessError(
            400,
            "Reservations must be placed at least 2 hours before the service start time."
        );
    }

    const client: PoolClient = await pool.connect();

    try {
        await client.query("BEGIN");

        //Vincolo: 1 sola prenotazione attiva per hiker nello stesso slot
        const overlapCheckQuery = `
      SELECT id FROM meal_reservation
      WHERE hiker_id = $1 
        AND status = 'CONFIRMED'
        AND starts_at < $3 
        AND ends_at > $2
      LIMIT 1
    `;
        const overlapRes = await client.query(overlapCheckQuery, [
            dto.hikerId,
            startsAt,
            endsAt,
        ]);

        if (overlapRes.rows.length > 0) {
            throw new ReservationBusinessError(
                409,
                "You already have a confirmed reservation for this time window."
            );
        }

        const tablesAvailability = await getTablesAvailability(client, startsAt, endsAt);

        let tableAssignments;
        try {
            tableAssignments = assignTablesToParty(dto.partySize, tablesAvailability);
        } catch (err: any) {
            if (err.message === "INSUFFICIENT_CAPACITY") {
                throw new ReservationBusinessError(
                    400,
                    "Not enough seats available for the selected time window."
                );
            }
            throw err;
        }

        const insertReservationQuery = `
      INSERT INTO meal_reservation (hiker_id, starts_at, ends_at, party_size, status)
      VALUES ($1, $2, $3, $4, 'CONFIRMED')
      RETURNING id, hiker_id, starts_at, ends_at, party_size, status, created_at
    `;
        const resResult = await client.query(insertReservationQuery, [
            dto.hikerId,
            startsAt,
            endsAt,
            dto.partySize,
        ]);
        const reservation = resResult.rows[0];

        const insertAssignmentQuery = `
      INSERT INTO reservation_table (reservation_id, dining_table_id, seats_assigned)
      VALUES ($1, $2, $3)
    `;
        for (const assignment of tableAssignments) {
            await client.query(insertAssignmentQuery, [
                reservation.id,
                assignment.tableId,
                assignment.seatsAssigned,
            ]);
        }

        await client.query("COMMIT");

        return {
            id: reservation.id,
            hikerId: reservation.hiker_id,
            startsAt: reservation.starts_at,
            endsAt: reservation.ends_at,
            partySize: reservation.party_size,
            status: reservation.status,
            createdAt: reservation.created_at,
            assignedTables: tableAssignments,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}