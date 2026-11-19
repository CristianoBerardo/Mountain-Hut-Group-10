export interface ReservationEmailDetails {
    hikerName: string;
    hikerSurname?: string | null;
    reservationId: string;
    date: string;
    startsAt: string;
    endsAt: string;
    partySize: number;
    tables: Array<{ tableNumber: number; seatsAssigned: number }>;
}