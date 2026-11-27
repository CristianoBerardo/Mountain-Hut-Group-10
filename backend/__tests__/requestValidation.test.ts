import {
  requestObject,
  requiredString,
  positiveInteger,
  nonNegativeInteger,
  booleanValue,
  booleanQuery,
  optionalString,
  reservationAllergens,
} from "../utils/requestValidation";
import { InvalidRequestError } from "../errors/AppError";
import { AllergenType } from "../types/AllergensType";

describe("Request Validation Utils", () => {
  describe("requestObject", () => {
    it("returns object when input is a valid record", () => {
      const obj = { key: "value" };
      expect(requestObject(obj)).toBe(obj);
    });

    it("throws InvalidRequestError when input is not an object", () => {
      expect(() => requestObject(null)).toThrow(InvalidRequestError);
      expect(() => requestObject([1, 2, 3])).toThrow(InvalidRequestError);
      expect(() => requestObject("string")).toThrow(InvalidRequestError);
      expect(() => requestObject(123)).toThrow(InvalidRequestError);
    });
  });

  describe("requiredString", () => {
    it("returns trimmed string when valid", () => {
      expect(requiredString("  hello  ", "greeting")).toBe("hello");
    });

    it("throws when string is missing or empty or whitespace only", () => {
      expect(() => requiredString(undefined, "field")).toThrow(InvalidRequestError);
      expect(() => requiredString(null, "field")).toThrow(InvalidRequestError);
      expect(() => requiredString("", "field")).toThrow(InvalidRequestError);
      expect(() => requiredString("   ", "field")).toThrow(InvalidRequestError);
      expect(() => requiredString(123, "field")).toThrow(
        "field must be a string",
      );
    });
  });

  describe("positiveInteger", () => {
    it("returns number when positive integer", () => {
      expect(positiveInteger(5, "count")).toBe(5);
    });

    it("throws when zero, negative, float or non-number", () => {
      expect(() => positiveInteger(0, "count")).toThrow(InvalidRequestError);
      expect(() => positiveInteger(-1, "count")).toThrow(InvalidRequestError);
      expect(() => positiveInteger(3.14, "count")).toThrow(InvalidRequestError);
      expect(() => positiveInteger("5", "count")).toThrow(InvalidRequestError);
    });
  });

  describe("nonNegativeInteger", () => {
    it("returns number when zero or positive integer", () => {
      expect(nonNegativeInteger(0, "count")).toBe(0);
      expect(nonNegativeInteger(10, "count")).toBe(10);
    });

    it("throws when negative, float or non-number", () => {
      expect(() => nonNegativeInteger(-1, "count")).toThrow(InvalidRequestError);
      expect(() => nonNegativeInteger(1.5, "count")).toThrow(InvalidRequestError);
      expect(() => nonNegativeInteger("0", "count")).toThrow(InvalidRequestError);
    });
  });

  describe("booleanValue", () => {
    it("returns boolean value", () => {
      expect(booleanValue(true, "flag")).toBe(true);
      expect(booleanValue(false, "flag")).toBe(false);
    });

    it("throws when non-boolean", () => {
      expect(() => booleanValue("true", "flag")).toThrow(InvalidRequestError);
      expect(() => booleanValue(1, "flag")).toThrow(InvalidRequestError);
    });
  });

  describe("booleanQuery", () => {
    it("parses query parameters accurately", () => {
      expect(booleanQuery(undefined, "flag")).toBeUndefined();
      expect(booleanQuery("true", "flag")).toBe(true);
      expect(booleanQuery("false", "flag")).toBe(false);
    });

    it("throws when value is neither true nor false", () => {
      expect(() => booleanQuery("yes", "flag")).toThrow(
        "flag must be true or false",
      );
    });
  });

  describe("optionalString", () => {
    it("returns undefined when value is undefined", () => {
      expect(optionalString(undefined, "field")).toBeUndefined();
    });

    it("returns string when valid", () => {
      expect(optionalString("hello", "field")).toBe("hello");
    });

    it("throws when value is not a string", () => {
      expect(() => optionalString(123, "field")).toThrow(
        "field must be a string",
      );
    });
  });

  describe("reservationAllergens", () => {
    it("returns undefined when value is undefined", () => {
      expect(reservationAllergens(undefined, 4)).toBeUndefined();
    });

    it("throws when value is not an array", () => {
      expect(() => reservationAllergens("not-an-array", 4)).toThrow(
        "allergens must be an array",
      );
    });

    it("parses and deduplicates valid allergens groups", () => {
      const input = [
        {
          people_count: 2,
          allergens: [
            AllergenType.GLUTEN_CEREALS,
            AllergenType.MILK,
            AllergenType.GLUTEN_CEREALS,
          ],
        },
      ];

      const result = reservationAllergens(input, 4);
      expect(result).toEqual([
        {
          people_count: 2,
          allergens: [AllergenType.GLUTEN_CEREALS, AllergenType.MILK],
        },
      ]);
    });

    it("throws when group allergens array is empty", () => {
      const input = [{ people_count: 1, allergens: [] }];
      expect(() => reservationAllergens(input, 2)).toThrow(
        "allergens[0].allergens must be a non-empty array",
      );
    });

    it("throws when allergen is invalid", () => {
      const input = [{ people_count: 1, allergens: ["UNKNOWN_ALLERGEN"] }];
      expect(() => reservationAllergens(input, 2)).toThrow(
        "Invalid allergen in allergens[0]",
      );
    });

    it("throws when duplicate allergen combinations are submitted", () => {
      const input = [
        {
          people_count: 1,
          allergens: [AllergenType.GLUTEN_CEREALS, AllergenType.PEANUTS],
        },
        {
          people_count: 1,
          allergens: [AllergenType.PEANUTS, AllergenType.GLUTEN_CEREALS],
        },
      ];
      expect(() => reservationAllergens(input, 4)).toThrow(
        "Duplicate allergen combination: use a single group",
      );
    });

    it("throws when total people with allergens exceeds party size", () => {
      const input = [
        { people_count: 3, allergens: [AllergenType.GLUTEN_CEREALS] },
        { people_count: 2, allergens: [AllergenType.EGGS] },
      ];
      expect(() => reservationAllergens(input, 4)).toThrow(
        "The total number of people with allergens exceeds party_size",
      );
    });
  });
});
