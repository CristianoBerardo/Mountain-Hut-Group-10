import {
  isPositiveInteger,
  isUuid,
  isValidDate,
  isValidTime,
} from "../utils/slotValidation";

describe("slot input validation", () => {
  it("accepts only real ISO calendar dates", () => {
    expect(isValidDate("2026-02-28")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
  });

  it("accepts valid 24-hour times", () => {
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("12:30:15")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
  });

  it("validates UUIDs and positive integer seat counts", () => {
    expect(isUuid("c0a80101-0000-4000-8000-000000000001")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isPositiveInteger(3)).toBe(true);
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(1.5)).toBe(false);
  });
});
