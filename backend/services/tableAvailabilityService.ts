import { PoolClient } from "pg";
import { TableAvailability } from "../types/reservationTypes";

//Calcola la capienza residua di ciascun tavolo per l'intervallo [startsAt, endsAt] tenendo conto di tutte le prenotazioni CONFIRMED che si sovrappongono.

export async function getTablesAvailability(
    client: PoolClient,
    startsAt: Date,
    endsAt: Date
): Promise<TableAvailability[]> {
    const query = `
    SELECT 
      dt.id AS table_id,
      dt.table_number,
      dt.capacity AS total_capacity,
      COALESCE(SUM(rt.seats_assigned), 0)::smallint AS occupied_seats,
      (dt.capacity - COALESCE(SUM(rt.seats_assigned), 0))::smallint AS free_seats
    FROM dining_table dt
    LEFT JOIN reservation_table rt ON rt.dining_table_id = dt.id
    LEFT JOIN meal_reservation mr ON mr.id = rt.reservation_id 
      AND mr.status = 'CONFIRMED'
      -- Condizione standard di overlap temporale: (StartA < EndB) AND (EndA > StartB)
      AND mr.starts_at < $2 
      AND mr.ends_at > $1
    WHERE dt.is_active = TRUE
    GROUP BY dt.id, dt.table_number, dt.capacity
    ORDER BY dt.table_number ASC
  `;

    const result = await client.query(query, [startsAt, endsAt]);

    return result.rows.map((row) => ({
        tableId: row.table_id,
        tableNumber: row.table_number,
        totalCapacity: row.total_capacity,
        occupiedSeats: row.occupied_seats,
        freeSeats: row.free_seats,
    }));
}