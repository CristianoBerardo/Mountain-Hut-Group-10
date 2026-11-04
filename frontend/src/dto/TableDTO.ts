export interface TableDTO {
    id: string;
    table_number: number;
    capacity: number;
    occupancy: number;
    is_active: boolean;
}

/**
 * Body accepted by POST /api/v1/tables and PATCH /api/v1/tables/:id.
 * table_number and capacity are required by the backend.
 */
export interface TableInputDTO {
    table_number: number;
    capacity: number;
    occupancy: number;
    is_active: boolean;
}

export interface TableFilters {
    active?: boolean;
    available?: boolean;
}
