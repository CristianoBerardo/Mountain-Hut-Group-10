export interface CheckAvailabilityTableDTO {
  table_id: string;
  table_number: number;
  seats_assigned: number;
}

export interface CheckAvailabilityResponseDTO {
  meal_slot_id: string | null;
  available_times: string[];
  date: string;
  time: string;
  party_size: number;
  available: boolean;
  available_seats: number;
  tables: CheckAvailabilityTableDTO[];
}
