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

jest.mock("../middleware/authenticateToken", () => ({
  authenticateToken: (_req: any, res: any, next: any) => {
    res.locals.user = { uid: "test-uid", role: "EMPLOYEE" };
    next();
  },
}));

jest.mock("../middleware/authorizeRole", () => ({
  authorizeRole: () => (_req: any, _res: any, next: any) => next(),
}));

const poolQuery = jest.spyOn(pool, "query");

const sampleTable = {
  id: "11111111-1111-1111-1111-111111111111",
  table_number: 1,
  capacity: 4,
  occupancy: 0,
  is_active: true,
};

describe("Table Endpoints (/api/v1/tables)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/tables", () => {
    it("returns list of tables without query params", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [sampleTable] } as never);

      const res = await request(app).get("/api/v1/tables");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([sampleTable]);
      expect(poolQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM dining_table WHERE 1=1"),
        [],
      );
    });

    it("filters tables by active and available query params", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [sampleTable] } as never);

      const res = await request(app)
        .get("/api/v1/tables")
        .query({ active: "true", available: "true" });

      expect(res.status).toBe(200);
      expect(poolQuery).toHaveBeenCalledWith(
        expect.stringContaining("AND is_active = $1 AND occupancy < capacity"),
        [true],
      );
    });

    it("rejects invalid boolean query parameter", async () => {
      const res = await request(app)
        .get("/api/v1/tables")
        .query({ active: "invalid" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_REQUEST");
    });

    it("returns 500 when database query fails", async () => {
      poolQuery.mockRejectedValueOnce(new Error("DB error") as never);

      const res = await request(app).get("/api/v1/tables");
      expect(res.status).toBe(500);
      expect(res.body.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  describe("GET /api/v1/tables/:id", () => {
    it("returns table by id", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [sampleTable] } as never);

      const res = await request(app).get(`/api/v1/tables/${sampleTable.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(sampleTable);
    });

    it("returns 404 when table is not found", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);

      const res = await request(app).get(`/api/v1/tables/${sampleTable.id}`);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns 500 on db failure", async () => {
      poolQuery.mockRejectedValueOnce(new Error("DB error") as never);

      const res = await request(app).get(`/api/v1/tables/${sampleTable.id}`);
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/v1/tables/number/:table_number", () => {
    it("returns table by table_number", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [sampleTable] } as never);

      const res = await request(app).get("/api/v1/tables/number/1");
      expect(res.status).toBe(200);
      expect(res.body).toEqual(sampleTable);
    });

    it("returns 404 when table number does not exist", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);

      const res = await request(app).get("/api/v1/tables/number/99");
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns 400 when table number is invalid", async () => {
      const res = await request(app).get("/api/v1/tables/number/-1");
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_REQUEST");
    });
  });

  describe("POST /api/v1/tables", () => {
    it("creates table with valid data", async () => {
      // checkTableExists -> not exists
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);
      // insert table
      poolQuery.mockResolvedValueOnce({ rows: [sampleTable] } as never);

      const res = await request(app).post("/api/v1/tables").send({
        table_number: 1,
        capacity: 4,
        occupancy: 0,
        is_active: true,
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(sampleTable);
    });

    it("accepts camelCase properties", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);
      poolQuery.mockResolvedValueOnce({ rows: [sampleTable] } as never);

      const res = await request(app).post("/api/v1/tables").send({
        tableNumber: 1,
        capacity: 4,
        isActive: true,
      });

      expect(res.status).toBe(201);
    });

    it("rejects when occupancy exceeds capacity", async () => {
      const res = await request(app).post("/api/v1/tables").send({
        table_number: 1,
        capacity: 4,
        occupancy: 5,
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_REQUEST");
    });

    it("rejects when table number already exists (409 Conflict)", async () => {
      // checkTableExists -> table exists
      poolQuery.mockResolvedValueOnce({ rows: [sampleTable] } as never);

      const res = await request(app).post("/api/v1/tables").send({
        table_number: 1,
        capacity: 4,
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONFLICT");
    });

    it("rejects missing table_number or capacity", async () => {
      const res = await request(app).post("/api/v1/tables").send({
        occupancy: 0,
      });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/v1/tables/:id", () => {
    it("updates table successfully", async () => {
      // checkTableExists -> false
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);
      // update query -> returns updated row
      poolQuery.mockResolvedValueOnce({
        rows: [{ ...sampleTable, capacity: 6 }],
      } as never);

      const res = await request(app)
        .patch(`/api/v1/tables/${sampleTable.id}`)
        .send({
          table_number: 1,
          capacity: 6,
          occupancy: 0,
          is_active: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.capacity).toBe(6);
    });

    it("returns 404 when table to update is not found", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);

      const res = await request(app)
        .patch(`/api/v1/tables/${sampleTable.id}`)
        .send({
          table_number: 1,
          capacity: 6,
        });

      expect(res.status).toBe(404);
    });

    it("returns 409 when updated table_number conflicts with another table", async () => {
      poolQuery.mockResolvedValueOnce({
        rows: [{ id: "other-id", table_number: 2 }],
      } as never);

      const res = await request(app)
        .patch(`/api/v1/tables/${sampleTable.id}`)
        .send({
          table_number: 2,
          capacity: 4,
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONFLICT");
    });
  });

  describe("PATCH /api/v1/tables/:id/reset", () => {
    it("resets occupancy to 0", async () => {
      poolQuery.mockResolvedValueOnce({
        rows: [{ ...sampleTable, occupancy: 0 }],
      } as never);

      const res = await request(app).patch(
        `/api/v1/tables/${sampleTable.id}/reset`,
      );

      expect(res.status).toBe(200);
      expect(res.body.occupancy).toBe(0);
    });

    it("returns 404 if table does not exist", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);

      const res = await request(app).patch(
        `/api/v1/tables/${sampleTable.id}/reset`,
      );
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/tables/:id", () => {
    it("deletes table successfully", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [sampleTable] } as never);

      const res = await request(app).delete(`/api/v1/tables/${sampleTable.id}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Table deleted successfully");
    });

    it("returns 404 when table does not exist", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);

      const res = await request(app).delete(`/api/v1/tables/${sampleTable.id}`);
      expect(res.status).toBe(404);
    });
  });
});
