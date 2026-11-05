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

export interface MealSlotDetailsDTO {
    slot: MealSlotDTO;
    tables: SlotTableDTO[];
}

/** Row returned by GET /slots/available (only slots with at least one table). */
export interface AvailableSlotDTO {
    slot_id: string;
    date: string;
    starts_at: string;
    ends_at: string;
    active_tables_count: number;
    total_capacity: number;
    total_booked: number;
    available_seats: number;
}
