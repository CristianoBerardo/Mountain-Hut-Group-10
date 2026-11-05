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
const tableId = "bbbbbbbb-0001-0001-0001-000000000001";
const testDate = "2026-11-20";

const validSlot = {
    id: slotId,
    date: testDate,
    starts_at: "12:00:00",
    ends_at: "13:30:00",
    created_at: new Date().toISOString(),
};

const validSlotRequest = {
    date: testDate,
    starts_at: "12:00",
    ends_at: "13:30",
};

describe("POST /api/v1/slots (Create Slot)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("creates a new meal slot with flexible times", async () => {
        poolQuery.mockResolvedValueOnce({ rows: [validSlot] } as never);

        const response = await request(app)
            .post("/api/v1/slots")
            .send(validSlotRequest);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(validSlot);
        expect(poolQuery).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO meal_slot"),
            [validSlotRequest.date, validSlotRequest.starts_at, validSlotRequest.ends_at]
        );
    });

    it.each([
        [{ ...validSlotRequest, date: undefined }, "date, starts_at and ends_at are required"],
        [{ ...validSlotRequest, starts_at: undefined }, "date, starts_at and ends_at are required"],
        [{ ...validSlotRequest, ends_at: undefined }, "date, starts_at and ends_at are required"],
    ])("rejects slot creation with missing fields", async (body, error) => {
        const response = await request(app).post("/api/v1/slots").send(body);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error });
        expect(poolQuery).not.toHaveBeenCalled();
    });

    it("returns 409 Conflict if slot already exists (unique constraint violation)", async () => {
        poolQuery.mockRejectedValueOnce({ code: "23505" } as never);

        const response = await request(app)
            .post("/api/v1/slots")
            .send(validSlotRequest);

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: "Slot already exists" });
    });

    it("returns 500 on unexpected database failure", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        poolQuery.mockRejectedValueOnce(new Error("DB error") as never);

        const response = await request(app)
            .post("/api/v1/slots")
            .send(validSlotRequest);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Internal server error" });
        consoleSpy.mockRestore();
    });
});

describe("GET /api/v1/slots", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("retrieves all meal slots", async () => {
        poolQuery.mockResolvedValueOnce({ rows: [validSlot] } as never);

        const response = await request(app).get("/api/v1/slots");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([validSlot]);
        expect(poolQuery).toHaveBeenCalledWith(
            expect.stringContaining("SELECT * FROM meal_slot ORDER BY created_at ASC")
        );
    });
});

describe("GET /api/v1/slots/:id", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("retrieves a meal slot by ID", async () => {
        poolQuery.mockResolvedValueOnce({ rows: [validSlot] } as never);

        const response = await request(app).get(`/api/v1/slots/${slotId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(validSlot);
        expect(poolQuery).toHaveBeenCalledWith(
            expect.stringContaining("WHERE id = $1"),
            [slotId]
        );
    });

    it("returns 404 when slot does not exist", async () => {
        poolQuery.mockResolvedValueOnce({ rows: [] } as never);

        const response = await request(app).get(`/api/v1/slots/${slotId}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Slot not found" });
    });
});

describe("GET /api/v1/slots/:id/details (Configuration Reuse)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns slot details along with assigned tables and remaining capacity", async () => {
        const slotDetails = {
            slot: validSlot,
            tables: [
                {
                    id: tableId,
                    table_number: 1,
                    capacity: 4,
                    booked_seats: 1,
                    available_seats: 3,
                },
            ],
        };

        // First query checks slot, second query retrieves tables
        poolQuery
            .mockResolvedValueOnce({ rows: [validSlot] } as never)
            .mockResolvedValueOnce({ rows: slotDetails.tables } as never);

        const response = await request(app).get(`/api/v1/slots/${slotId}/details`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(slotDetails);
    });

    it("returns 404 when retrieving details of a non-existent slot", async () => {
        poolQuery.mockResolvedValueOnce({ rows: [] } as never);

        const response = await request(app).get(`/api/v1/slots/${slotId}/details`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Slot not found" });
    });
});

describe("POST /api/v1/slots/:id/tables (Assign Table to Slot)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("adds an active dining table to a meal slot", async () => {
        // 1. slot exists, 2. table exists and is active, 3. insert succeeds
        poolQuery
            .mockResolvedValueOnce({ rows: [{ id: slotId }] } as never)
            .mockResolvedValueOnce({ rows: [{ id: tableId, is_active: true }] } as never)
            .mockResolvedValueOnce({ rows: [] } as never);

        const response = await request(app)
            .post(`/api/v1/slots/${slotId}/tables`)
            .send({ dining_table_id: tableId });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message: "Table added to slot",
            slot_id: slotId,
            dining_table_id: tableId,
        });
        expect(poolQuery).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO slot_table"),
            [slotId, tableId]
        );
    });

    it("returns 400 if dining_table_id is missing", async () => {
        const response = await request(app)
            .post(`/api/v1/slots/${slotId}/tables`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "dining_table_id is required" });
    });

    it("returns 404 if the slot is not found", async () => {
        poolQuery.mockResolvedValueOnce({ rows: [] } as never);

        const response = await request(app)
            .post(`/api/v1/slots/${slotId}/tables`)
            .send({ dining_table_id: tableId });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Slot not found" });
    });

    it("returns 404 if the table is not found or is inactive", async () => {
        poolQuery
            .mockResolvedValueOnce({ rows: [{ id: slotId }] } as never)
            .mockResolvedValueOnce({ rows: [] } as never); // Inactive or not found

        const response = await request(app)
            .post(`/api/v1/slots/${slotId}/tables`)
            .send({ dining_table_id: tableId });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Table not found or inactive" });
    });
});

describe("DELETE /api/v1/slots/:id/tables/:tableId (Remove Table from Slot)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("successfully removes a table from a slot when no active reservations exist", async () => {
        // 1. no active reservations, 2. delete query returns rowCount: 1
        poolQuery
            .mockResolvedValueOnce({ rows: [] } as never)
            .mockResolvedValueOnce({ rowCount: 1 } as never);

        const response = await request(app).delete(
            `/api/v1/slots/${slotId}/tables/${tableId}`
        );

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "Table removed from slot" });
    });

    it("returns 409 Conflict if active reservations exist for the table on that slot", async () => {
        poolQuery.mockResolvedValueOnce({ rows: [{ reservation_id: "res-1" }] } as never);

        const response = await request(app).delete(
            `/api/v1/slots/${slotId}/tables/${tableId}`
        );

        expect(response.status).toBe(409);
        expect(response.body.error).toMatch(/active reservations exist/i);
    });

    it("returns 404 if table was not associated with this slot", async () => {
        poolQuery
            .mockResolvedValueOnce({ rows: [] } as never)
            .mockResolvedValueOnce({ rowCount: 0 } as never);

        const response = await request(app).delete(
            `/api/v1/slots/${slotId}/tables/${tableId}`
        );

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Table not associated with this slot" });
    });
});

describe("DELETE /api/v1/slots/:id (Delete Slot)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("successfully deletes a slot", async () => {
        poolQuery.mockResolvedValueOnce({ rowCount: 1 } as never);

        const response = await request(app).delete(`/api/v1/slots/${slotId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "Slot deleted successfully" });
    });

    it("returns 404 when deleting a non-existent slot", async () => {
        poolQuery.mockResolvedValueOnce({ rowCount: 0 } as never);

        const response = await request(app).delete(`/api/v1/slots/${slotId}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Slot not found" });
    });
});