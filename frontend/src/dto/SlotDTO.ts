// GET /api/v1/slots/available
export interface SlotTableDTO {
    id: string;
    table_number: number;
    capacity: number;
    booked_seats: number;
    available_seats: number;
}

export interface AvailableSlotDTO {
    slot_id: string;
    date: string;           // 'YYYY-MM-DD'
    starts_at: string;      // 'HH:MM:SS'
    ends_at: string;        // 'HH:MM:SS'
    active_tables_count: number;
    total_capacity: number;
    total_booked: number;
    available_seats: number;
    dining_tables: SlotTableDTO[];
}
