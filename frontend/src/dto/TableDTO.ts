export interface TableDTO {
    id: string;
    table_number: number;
    capacity: number;
    occupancy: number;
    is_active: boolean;
}

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
