export interface DiningTableDTO {
    id: string;
    table_number: number;
    capacity: number;
    occupancy: number;
    is_active: boolean;
}

// POST /api/v1/tables
export interface CreateDiningTableDTO {
    table_number: number;
    capacity: number;
}
