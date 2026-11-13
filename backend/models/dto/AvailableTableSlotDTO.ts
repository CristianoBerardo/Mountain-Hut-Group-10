/** Available seats for a dining table assigned to a specific meal slot. */
export interface AvailableDiningTableDTO {
  id: string;
  table_number: number;
  capacity: number;
  booked_seats: number;
  available_seats: number;
}

/** Slot availability calculated from active tables and confirmed reservations. */
export interface AvailableTableSlotDTO {
  slot_id: string;
  date: string;
  starts_at: string;
  ends_at: string;
  active_tables_count: number;
  total_capacity: number;
  total_booked: number;
  available_seats: number;
  dining_tables: AvailableDiningTableDTO[];
}
