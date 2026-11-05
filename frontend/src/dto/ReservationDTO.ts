// POST /api/v1/reservations
export interface CreateReservationDTO {
    hiker_id: string;
    slot_id: string;
    party_size: number;
}

export interface ReservationDTO {
    id: string;
    hiker_id: string;
    slot_id: string;
    starts_at: string;
    ends_at: string;
    party_size: number;
    status: string;
    created_at: string;
}

export interface AssignedTableDTO {
    dining_table_id: string;
    table_number: number;
    seats_assigned: number;
}

export interface CreateReservationResponseDTO {
    reservation: ReservationDTO;
    tables: AssignedTableDTO[];
}
