export interface ReservationEmailDetails {
    hikerName: string;
    hikerSurname: string;
    reservationId: string;
    date: string;
    startsAt: string;
    endsAt: string;
    partySize: number;
    tables: Array<{ tableNumber: number; seatsAssigned: number }>;
}