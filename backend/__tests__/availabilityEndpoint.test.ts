import request from "supertest";
import app from "../app";
import { pool } from "../connections/PostgreSQL/database";

jest.mock("../connections/PostgreSQL/database", () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
}));

jest.mock("../config/firebaseAdmin", () => ({
  adminAuth: {
    verifyIdToken: jest.fn(),
    setCustomUserClaims: jest.fn(),
  },
}));

const poolQuery = jest.spyOn(pool, "query");
const slotId = "aaaaaaaa-0001-0001-0001-000000000001";
const testDate = "2026-11-20";

describe("GET /api/v1/slots/availability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is public and returns a seating plan for a party", async () => {
    poolQuery.mockResolvedValueOnce({
      rows: [
        {
          available_times: ["12:00"],
          slot_id: slotId,
          table_id: "bbbbbbbb-0001-0001-0001-000000000001",
          table_number: 1,
          capacity: 2,
          booked_seats: 0,
          free_seats: 2,
        },
        {
          slot_id: slotId,
          table_id: "bbbbbbbb-0002-0002-0002-000000000002",
          table_number: 2,
          capacity: 4,
          booked_seats: 1,
          free_seats: 3,
        },
        {
          slot_id: slotId,
          table_id: "bbbbbbbb-0003-0003-0003-000000000003",
          table_number: 3,
          capacity: 2,
          booked_seats: 1,
          free_seats: 1,
        },
      ],
    } as never);

    const response = await request(app).get(
      `/api/v1/slots/availability?date=${testDate}&time=12:00&party_size=6`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      slot_id: slotId,
      available_times: ["12:00"],
      date: testDate,
      time: "12:00",
      party_size: 6,
      available: true,
      available_seats: 6,
      tables: [
        {
          table_id: "bbbbbbbb-0001-0001-0001-000000000001",
          table_number: 1,
          seats_assigned: 2,
        },
        {
          table_id: "bbbbbbbb-0002-0002-0002-000000000002",
          table_number: 2,
          seats_assigned: 3,
        },
        {
          table_id: "bbbbbbbb-0003-0003-0003-000000000003",
          table_number: 3,
          seats_assigned: 1,
        },
      ],
    });
    expect(poolQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE date = $1::date"),
      [testDate, "12:00"],
    );
  });

  it("returns unavailable when free seats cannot fit the party", async () => {
    poolQuery.mockResolvedValueOnce({
      rows: [
        {
          available_times: ["12:00"],
          slot_id: slotId,
          table_id: "bbbbbbbb-0001-0001-0001-000000000001",
          table_number: 1,
          capacity: 2,
          booked_seats: 1,
          free_seats: 1,
        },
      ],
    } as never);

    const response = await request(app).get(
      `/api/v1/slots/availability?date=${testDate}&time=12:00&party_size=2`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      available: false,
      available_seats: 1,
      tables: [],
    });
  });

  it.each([
    [
      "date=2026-02-31&time=12:00&party_size=2",
      "date must be a valid date in YYYY-MM-DD format",
    ],
    [
      `date=${testDate}&time=25:00&party_size=2`,
      "time must be in HH:mm format",
    ],
    [
      `date=${testDate}&time=12:00&party_size=0`,
      "party_size must be a positive integer",
    ],
  ])("rejects invalid query parameters", async (query, error) => {
    const response = await request(app).get(
      `/api/v1/slots/availability?${query}`,
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(error);
    expect(poolQuery).not.toHaveBeenCalled();
  });

  it("returns unavailable when no slot matches the date and time", async () => {
    poolQuery.mockResolvedValueOnce({
      rows: [
        {
          available_times: [],
          slot_id: null,
          table_id: null,
          table_number: null,
          capacity: null,
          booked_seats: null,
          free_seats: null,
        },
      ],
    } as never);

    const response = await request(app).get(
      `/api/v1/slots/availability?date=${testDate}&time=12:00&party_size=2`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      slot_id: null,
      available_times: [],
      date: testDate,
      time: "12:00",
      party_size: 2,
      available: false,
      available_seats: 0,
      tables: [],
    });
  });

  it("returns the day's start times when the requested time is not a slot", async () => {
    poolQuery.mockResolvedValueOnce({
      rows: [
        {
          available_times: ["12:00", "18:30"],
          slot_id: null,
          table_id: null,
          table_number: null,
          capacity: null,
          booked_seats: null,
          free_seats: null,
        },
      ],
    } as never);

    const response = await request(app).get(
      `/api/v1/slots/availability?date=${testDate}&time=13:00&party_size=2`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      slot_id: null,
      available_times: ["12:00", "18:30"],
      available: false,
    });
  });
});
