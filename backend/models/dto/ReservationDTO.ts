// POST /api/v1/reservations  (US1)
export interface CreateReservationDTO {
  slot_id: string; // which slot to book
  party_size: number; // number of people
}

// POST /api/v1/slots  (US2)
export interface CreateSlotDTO {
  date: string; // 'YYYY-MM-DD'
  starts_at: string; // 'HH:MM'
  ends_at: string; // 'HH:MM'
  tables: Array<{
    dining_table_id: string;
    seats_in_slot: number;
  }>;
}

// GET /api/v1/slots response item
export interface SlotAvailabilityDTO {
  slot_id: string;
  date: string;
  starts_at: string;
  ends_at: string;
  total_seats: number;
  booked_seats: number;
  available_seats: number;
}
