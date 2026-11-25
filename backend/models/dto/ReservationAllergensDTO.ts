import { AllergenType } from "../../types/AllergensType";

export interface ReservationAllergensDTO {
  // Number of people sharing the allergen combination specified in this group
  people_count: number;
  allergens: AllergenType[];
}
