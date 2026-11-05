export interface MealSlotDTO {
    id: string;
    date: string; // 'YYYY-MM-DD'
    starts_at: string; // 'HH:MM:SS'
    ends_at: string; // 'HH:MM:SS'
    created_at?: string;
}

export interface CreateMealSlotDTO {
    date: string; // 'YYYY-MM-DD'
    starts_at: string; // 'HH:MM'
    ends_at: string; // 'HH:MM'
}

export interface SlotTableDTO {
    id: string;
    table_number: number;
    capacity: number;
    booked_seats: number;
    available_seats: number;
}

// GET /api/v1/slots/:id/details
export interface MealSlotDetailsDTO {
    slot: MealSlotDTO;
    tables: SlotTableDTO[];
}

// GET /api/v1/slots/available (only slots with at least one table)
export interface AvailableSlotDTO {
    slot_id: string;
    date: string; // 'YYYY-MM-DD'
    starts_at: string; // 'HH:MM:SS'
    ends_at: string; // 'HH:MM:SS'
    active_tables_count: number;
    total_capacity: number;
    total_booked: number;
    available_seats: number;
    dining_tables: SlotTableDTO[];
}
