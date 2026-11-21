import { PoolClient } from "pg";
import request from "supertest";
import app from "../app";
import { pool } from "../connections/PostgreSQL/database";
import { sendReservationConfirmation } from "../services/emailService";

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

jest.mock("../middleware/authenticateToken", () => ({
  authenticateToken: (_req: any, res: any, next: any) => {
    res.locals.user = { uid: hikerId, role: "HIKER" };
    next();
  },
}));

jest.mock("../middleware/authorizeRole", () => ({
  authorizeRole: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../services/emailService", () => ({
  sendReservationConfirmation: jest.fn().mockResolvedValue(undefined),
}));

const clientQuery = jest.fn();
const release = jest.fn();
const client = { query: clientQuery, release };
const connectSpy = jest.spyOn(pool, "connect");
const poolQuery = jest.spyOn(pool, "query");

const slotId = "aaaaaaaa-0001-0001-0001-000000000001";
const hikerId = "f2693a0f-0a2c-4402-a771-481f4a1f4ea8";
const tableId = "bbbbbbbb-0001-0001-0001-000000000001";
const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);
// Columns returned by meal_reservation itself, without the slot's timestamps.
const reservationRow = {
  id: "cccccccc-0001-0001-0001-000000000001",
  hiker_id: hikerId,
  meal_slot_id: slotId,
  party_size: 3,
  status: "CONFIRMED",
};

const slotTimes = {
  meal_slot_date: futureDate,
  meal_slot_starts_at: "18:00:00",
  meal_slot_ends_at: "19:00:00",
};

const reservation = {
  ...reservationRow,
  starts_at: `${futureDate}T18:00:00.000Z`,
  ends_at: `${futureDate}T19:00:00.000Z`,
};

const validRequest = {
  hiker_id: hikerId,
  meal_slot_id: slotId,
  party_size: reservation.party_size,
};

function configureAvailableSlotAndTables(
  tables: Array<{
    dining_table_id: string;
    table_number?: number;
    capacity: number;
    booked: number;
    free: number;
  }>,
) {
  poolQuery.mockResolvedValue({
    rows: [{
      id: hikerId,
      firebase_uid: "test-uid",
      name: "Mario",
      surname: "Rossi",
      email: "mario@example.com",
      role: "HIKER",
      mobile_number: "+391234567890",
    }],
  } as never);
  clientQuery.mockImplementation(async (sql: string) => {
    if (sql.includes("FROM meal_slot")) {
      return {
        rows: [
          {
            id: slotId,
            date: futureDate,
            starts_at: "18:00:00",
            ends_at: "19:00:00",
          },
        ],
      };
    }

    if (sql.includes("WHERE hiker_id = $1 AND meal_slot_id = $2")) {
      return { rows: [] };
    }

    if (sql.includes("FROM slot_table st")) {
      return { rows: tables };
    }

    if (sql.includes("INSERT INTO meal_reservation")) {
      return { rows: [reservationRow] };
    }

    if (sql.includes('FROM "user"')) {
      return { rows: [{ name: "Mario", surname: "Rossi", email: "mario@example.com" }] };
    }

    return { rows: [] };
  });
}

describe("POST /api/v1/reservations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectSpy.mockImplementation(() =>
      Promise.resolve(client as unknown as PoolClient),
    );
  });

  it("books an available table for the requested party size", async () => {
    configureAvailableSlotAndTables([
      { dining_table_id: "table-large", capacity: 6, booked: 0, free: 6 },
      { dining_table_id: tableId, table_number: 1, capacity: 4, booked: 0, free: 4 },
    ]);

    const response = await request(app)
      .post("/api/v1/reservations")
      .send(validRequest);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      reservation,
      tables: [{ dining_table_id: tableId, seats_assigned: 3, table_number: 1 }],
    });
    expect(clientQuery).toHaveBeenCalledWith(
      expect.stringMatching(
        /INSERT INTO meal_reservation\s+\(hiker_id, meal_slot_id, party_size, status, created_at\)/,
      ),
      [hikerId, slotId, reservation.party_size],
    );
    expect(clientQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO reservation_table"),
      [reservation.id, tableId, 3],
    );
    expect(clientQuery).toHaveBeenCalledWith("COMMIT");
    expect(release).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ ...validRequest, hiker_id: undefined }, "hiker_id is required"],
    [{ ...validRequest, meal_slot_id: undefined }, "meal_slot_id is required"],
    [{ ...validRequest, party_size: 0 }, "party_size must be a positive integer"],
  ])("rejects an invalid booking request", async (body, error) => {
    const response = await request(app)
      .post("/api/v1/reservations")
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ code: "INVALID_REQUEST", error });
    expect(connectSpy).not.toHaveBeenCalled();
  });

  it("returns 404 when the selected slot does not exist", async () => {
    clientQuery.mockResolvedValue({ rows: [] });

    const response = await request(app)
      .post("/api/v1/reservations")
      .send(validRequest);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ code: "NOT_FOUND", error: "Slot not found" });
    expect(clientQuery).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("rejects a duplicate confirmed reservation for the same slot", async () => {
    clientQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("FROM meal_slot")) {
        return {
          rows: [
            {
              id: slotId,
              date: futureDate,
              starts_at: "18:00:00",
              ends_at: "19:00:00",
            },
          ],
        };
      }

      return { rows: [{ id: reservation.id }] };
    });

    const response = await request(app)
      .post("/api/v1/reservations")
      .send(validRequest);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      code: "INVALID_REQUEST", error: "You already have a confirmed reservation for this slot",
    });
    expect(clientQuery).not.toHaveBeenCalledWith("BEGIN");
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("rolls back when the available seats cannot fit the party", async () => {
    configureAvailableSlotAndTables([
      { dining_table_id: tableId, capacity: 2, booked: 1, free: 1 },
    ]);

    const response = await request(app)
      .post("/api/v1/reservations")
      .send(validRequest);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      code: "INVALID_REQUEST", error: "Not enough seats available for this slot",
    });
    expect(clientQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(clientQuery).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO meal_reservation"),
      expect.anything(),
    );
    expect(release).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/v1/slots/available", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns available slots and their table availability", async () => {
    const availableSlots = [
      {
        meal_slot_id: slotId,
        date: futureDate,
        starts_at: "18:00:00",
        ends_at: "19:00:00",
        active_tables_count: 1,
        total_capacity: 4,
        total_booked: 1,
        available_seats: 3,
        dining_tables: [
          {
            id: tableId,
            table_number: 1,
            capacity: 4,
            booked_seats: 1,
            available_seats: 3,
          },
        ],
      },
    ];
    poolQuery.mockResolvedValueOnce({ rows: availableSlots } as never);

    const response = await request(app).get("/api/v1/slots/available");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(availableSlots);
    expect(poolQuery).toHaveBeenCalledWith(
      expect.stringContaining("AS available_seats"),
    );
  });

  it("returns 404 when no available slots are found", async () => {
    poolQuery.mockResolvedValueOnce({ rows: [] } as never);

    const response = await request(app).get("/api/v1/slots/available");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ code: "NOT_FOUND", error: "No meal slots with active dining tables were found." });
  });

  it("returns 500 when retrieving available slots fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    poolQuery.mockRejectedValueOnce(
      new Error("database unavailable") as never,
    );

    const response = await request(app).get("/api/v1/slots/available");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ code: "INTERNAL_SERVER_ERROR", error: "Unable to retrieve available meal slots. Please try again later." });
    consoleError.mockRestore();
  });
});

describe("GET /api/v1/reservations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns timestamps derived from the meal slot", async () => {
    poolQuery.mockResolvedValueOnce({
      rows: [{ ...reservationRow, ...slotTimes }],
    } as never);

    const response = await request(app).get("/api/v1/reservations");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([reservation]);
  });
});

describe("PATCH /api/v1/reservations/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectSpy.mockImplementation(() =>
      Promise.resolve(client as unknown as PoolClient),
    );
  });

  it("returns slot timestamps when the update returns only reservation columns", async () => {
    clientQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT mr.*")) {
        return { rows: [{ ...reservationRow, ...slotTimes }] };
      }
      if (sql.includes("FROM slot_table st")) {
        return {
          rows: [{
            dining_table_id: tableId,
            table_number: 1,
            capacity: 4,
            booked: 0,
            free: 4,
          }],
        };
      }
      if (sql.includes("UPDATE meal_reservation")) {
        return { rows: [{ ...reservationRow, party_size: 4 }] };
      }
      return { rows: [] };
    });

    const response = await request(app)
      .patch(`/api/v1/reservations/${reservation.id}`)
      .send({ party_size: 4 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      reservation: { ...reservation, party_size: 4 },
      tables: [{
        dining_table_id: tableId,
        table_number: 1,
        seats_assigned: 4,
      }],
    });
    expect(clientQuery).toHaveBeenCalledWith("COMMIT");
    expect(release).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/v1/reservations/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the reservation and its assigned tables", async () => {
    const reservationDetails = {
      ...reservation,
      tables: [{ dining_table_id: tableId, seats_assigned: 3 }],
    };
    poolQuery.mockResolvedValueOnce({
      rows: [{
        ...reservationRow,
        ...slotTimes,
        tables: reservationDetails.tables,
      }],
    } as never);

    const response = await request(app).get(
      `/api/v1/reservations/${reservation.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(reservationDetails);
    expect(poolQuery).toHaveBeenCalledWith(
      expect.stringContaining("WHERE mr.id = $1"),
      [reservation.id],
    );
  });

  it("returns 404 when the reservation does not exist", async () => {
    poolQuery.mockResolvedValueOnce({ rows: [] } as never);

    const response = await request(app).get(
      `/api/v1/reservations/${reservation.id}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ code: "NOT_FOUND", error: "Reservation not found" });
  });
});

describe("POST /api/v1/reservations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectSpy.mockImplementation(() =>
      Promise.resolve(client as unknown as PoolClient),
    );
  });

  test("6. triggers confirmation email post-commit when reservation succeeds", async () => {
    configureAvailableSlotAndTables([
      { dining_table_id: tableId, capacity: 4, booked: 0, free: 4 },
    ]);

    poolQuery.mockImplementation((sql: any) => {
      if (typeof sql === "string" && sql.includes('FROM "user"')) {
        return Promise.resolve({
          rows: [{ id: hikerId, firebase_uid: "test-uid", name: "Mario", surname: "Rossi", email: "mario@example.com", role: "HIKER", mobile_number: "+391234567890" }],
        } as never);
      }
      return Promise.resolve({ rows: [] } as never);
    });

    clientQuery.mockImplementation((sql: string) => {
      if (sql.includes("FROM meal_slot")) {
        return Promise.resolve({ rows: [{ id: slotId, date: futureDate, starts_at: "18:00:00", ends_at: "19:00:00" }] });
      }
      if (sql.includes("WHERE hiker_id = $1 AND meal_slot_id = $2")) {
        return Promise.resolve({ rows: [] });
      }
      if (sql.includes("FROM slot_table st")) {
        return Promise.resolve({ rows: [{ dining_table_id: tableId, table_number: 1, capacity: 4, booked: 0, free: 4 }] });
      }
      if (sql.includes("INSERT INTO meal_reservation")) {
        return Promise.resolve({ rows: [reservationRow] });
      }
      return Promise.resolve({ rows: [] });
    });

    const response = await request(app)
      .post("/api/v1/reservations")
      .send(validRequest);

    expect(response.status).toBe(201);
    expect(sendReservationConfirmation).toHaveBeenCalledTimes(1);
    expect(sendReservationConfirmation).toHaveBeenCalledWith(
      "mario@example.com",
      expect.objectContaining({
        hikerName: "Mario",
        date: futureDate,
        startsAt: "18:00",
        endsAt: "19:00",
        partySize: 3,
      })
    );
  });

  test("7. fault tolerance: reservation succeeds even if email service throws an error", async () => {
    configureAvailableSlotAndTables([
      { dining_table_id: tableId, capacity: 4, booked: 0, free: 4 },
    ]);

    poolQuery.mockImplementation((sql: any) => {
      if (typeof sql === "string" && sql.includes('FROM "user"')) {
        return Promise.resolve({
          rows: [{ id: hikerId, firebase_uid: "test-uid", name: "Mario", surname: "Rossi", email: "mario@example.com", role: "HIKER", mobile_number: "+391234567890" }],
        } as never);
      }
      return Promise.resolve({ rows: [] } as never);
    });

    clientQuery.mockImplementation((sql: string) => {
      if (sql.includes("FROM meal_slot")) {
        return Promise.resolve({ rows: [{ id: slotId, date: futureDate, starts_at: "18:00:00", ends_at: "19:00:00" }] });
      }
      if (sql.includes("WHERE hiker_id = $1 AND meal_slot_id = $2")) {
        return Promise.resolve({ rows: [] });
      }
      if (sql.includes("FROM slot_table st")) {
        return Promise.resolve({ rows: [{ dining_table_id: tableId, table_number: 1, capacity: 4, booked: 0, free: 4 }] });
      }
      if (sql.includes("INSERT INTO meal_reservation")) {
        return Promise.resolve({ rows: [reservationRow] });
      }
      return Promise.resolve({ rows: [] });
    });

    (sendReservationConfirmation as jest.Mock).mockRejectedValueOnce(
      new Error("SMTP service unreachable")
    );

    const response = await request(app)
      .post("/api/v1/reservations")
      .send(validRequest);

    expect(response.status).toBe(201);
    expect(response.body.reservation).toBeDefined();
    expect(sendReservationConfirmation).toHaveBeenCalledTimes(1);
  });
})