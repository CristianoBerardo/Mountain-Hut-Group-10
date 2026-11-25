import { AllergenType } from "../../types/AllergensType";

export interface ReservationAllergensDTO {
  people_count: number;
  allergens: AllergenType[];
}
