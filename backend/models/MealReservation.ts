import { MealReservationStatus } from "../types/MealReservationStatus";

export interface MealReservation {
  id: string;
  hiker_id: string;
  slot_id: string;
  party_size: number;
  status: MealReservationStatus;
  created_at: string;
}
