import { MealReservationStatus } from "../types/MealReservationStatus";

export interface MealReservation {
  id: string;
  hiker_id: string;
  starts_at: string;
  ends_at: string;
  slot_id: string;
  party_size: number;
  status: MealReservationStatus;
  created_at?: string;
}
