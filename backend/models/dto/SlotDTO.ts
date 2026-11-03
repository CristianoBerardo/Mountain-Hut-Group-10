export interface SlotTableAssignmentDTO {
    dining_table_id: string;
    seats_in_slot: number;
}

export interface CreateSlotInputDTO {
    date: string;               // 'YYYY-MM-DD'
    starts_at: string;          // 'HH:mm' 
    ends_at: string;            // 'HH:mm' 
    tables?: SlotTableAssignmentDTO[]; // Lista tavoli opzionale se si duplica
    copy_from_slot_id?: string;        // ID dello slot precedente da cui clonare i tavoli
}

export interface SlotDetailsResponse {
    id: string;
    date: string;
    starts_at: string;
    ends_at: string;
    created_at: Date;
    total_seats: number;
    tables: Array<{
        dining_table_id: string;
        table_number: number;
        capacity: number;
        seats_in_slot: number;
    }>;
}