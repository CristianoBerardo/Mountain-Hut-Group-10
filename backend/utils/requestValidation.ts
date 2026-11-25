import { InvalidRequestError } from "../errors/AppError";
import { ReservationAllergensDTO } from "../models/dto/ReservationAllergensDTO";
import { AllergenType } from "../types/AllergensType";

/** Accept only JSON objects before reading request fields. */
export function requestObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidRequestError("The request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

export function requiredString(value: unknown, field: string): string {
  if (value === undefined || value === null || value === "") {
    throw new InvalidRequestError(`${field} is required`);
  }
  if (typeof value !== "string") {
    throw new InvalidRequestError(`${field} must be a string`);
  }
  if (value.trim().length === 0) {
    throw new InvalidRequestError(`${field} is required`);
  }
  return value.trim();
}

export function positiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new InvalidRequestError(`${field} must be a positive integer`);
  }
  return value;
}

export function nonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InvalidRequestError(`${field} must be a non-negative integer`);
  }
  return value;
}

export function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new InvalidRequestError(`${field} must be a boolean`);
  }
  return value;
}

/** Parse query flags explicitly rather than treating arbitrary strings as false. */
export function booleanQuery(
  value: unknown,
  field: string,
): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new InvalidRequestError(`${field} must be true or false`);
}

export function optionalString(
  value: unknown,
  field: string,
): string | undefined {
  if (value === undefined) return undefined;

  if (typeof value !== "string") {
    throw new InvalidRequestError(`${field} must be a string`);
  }

  return value;
}

export function reservationAllergens(
  value: unknown,
  partySize: number,
): ReservationAllergensDTO[] | undefined {
  if (value === undefined) return undefined;

  if (!Array.isArray(value)) {
    throw new InvalidRequestError("allergens must be an array");
  }

  const combinations = new Set<string>();
  let totalPeople = 0;

  const groups = value.map((item, index): ReservationAllergensDTO => {
    const group = requestObject(item);

    const people_count = positiveInteger(
      group.people_count,
      `allergens[${index}].people_count`,
    );

    if (!Array.isArray(group.allergens) || group.allergens.length === 0) {
      throw new InvalidRequestError(
        `allergens[${index}].allergens must be a non-empty array`,
      );
    }

    const parsedAllergens = group.allergens.map((entry: unknown) => {
      const allergen = Object.values(AllergenType).find(
        (allowed) => allowed === entry,
      );

      if (allergen === undefined) {
        throw new InvalidRequestError(
          `Invalid allergen in allergens[${index}]`,
        );
      }

      return allergen;
    });
    // 1. Delete the duplicates allergens
    // 2. COnvert the set into an array
    // 3. Alphabetically order the allergens
    const normalized = [...new Set(parsedAllergens)].sort((a, b) =>
      a.localeCompare(b),
    );
    const combination = JSON.stringify(normalized);

    if (combinations.has(combination)) {
      throw new InvalidRequestError(
        "Duplicate allergen combination: use a single group",
      );
    }

    combinations.add(combination);
    totalPeople += people_count;

    return {
      people_count,
      allergens: normalized,
    };
  });

  if (totalPeople > partySize) {
    throw new InvalidRequestError(
      "The total number of people with allergens exceeds party_size",
    );
  }

  return groups;
}
