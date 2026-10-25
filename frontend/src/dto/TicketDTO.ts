export interface CreateTicketDTO {
    service_type: string;
}

export interface TicketDTO {
    id: string;
    code: string;
    service_type: string;
    status: string;
    creation_date: string;
    expiration_date: string | null;
}