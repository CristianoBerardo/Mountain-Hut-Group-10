import { MealReservationStatus } from "../../types/MealReservationStatus";
import { ReservationAllergensDTO } from "./ReservationAllergensDTO";

export interface MealReservationDTO {
  id: string;
  hiker_id: string;
  starts_at: string;
  ends_at: string;
  meal_slot_id: string;
  party_size: number;
  status: MealReservationStatus;
  allergens: ReservationAllergensDTO[];
  preferences: string | null;
  created_at: string;
}
