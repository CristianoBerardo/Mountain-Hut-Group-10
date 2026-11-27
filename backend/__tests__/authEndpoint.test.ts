import request from "supertest";
import app from "../app";
import { pool } from "../connections/PostgreSQL/database";
import { adminAuth } from "../config/firebaseAdmin";
import { UserRole } from "../types/UserRole";

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

let mockUser: any = { uid: "firebase-uid-123", role: UserRole.HIKER };

jest.mock("../middleware/authenticateToken", () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        code: "TOKEN_MISSING_INVALID",
        error: "Authorization header is missing or invalid",
      });
    }
    res.locals.user = mockUser;
    next();
  },
}));

const poolQuery = jest.spyOn(pool, "query");

const sampleHikerRow = {
  id: "user-uuid-1",
  firebase_uid: "firebase-uid-123",
  name: "John",
  surname: "Doe",
  email: "john.doe@example.com",
  mobile_number: "+391234567890",
  notes: "Vegetarian",
  emergency_contact: "+390987654321",
  role: UserRole.HIKER,
};

const sampleEmployeeRow = {
  id: "user-uuid-2",
  firebase_uid: "firebase-uid-456",
  name: "Mario",
  surname: null,
  email: "mario@hut.com",
  mobile_number: null,
  notes: null,
  emergency_contact: null,
  role: UserRole.EMPLOYEE,
};

describe("Auth Endpoints (/api/v1/auth)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { uid: "firebase-uid-123", role: UserRole.HIKER };
  });

  describe("POST /api/v1/auth/login", () => {
    it("logs in successfully as hiker and updates custom claims", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [sampleHikerRow] } as never);
      (adminAuth.setCustomUserClaims as jest.Mock).mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .set("Authorization", "Bearer valid-firebase-token");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.token).toBe("valid-firebase-token");
      expect(res.body.user).toEqual({
        id: sampleHikerRow.id,
        name: sampleHikerRow.name,
        surname: sampleHikerRow.surname,
        email: sampleHikerRow.email,
        mobileNumber: sampleHikerRow.mobile_number,
        notes: sampleHikerRow.notes,
        emergencyContact: sampleHikerRow.emergency_contact,
        role: UserRole.HIKER,
      });
      expect(adminAuth.setCustomUserClaims).toHaveBeenCalledWith(
        "firebase-uid-123",
        { role: UserRole.HIKER },
      );
    });

    it("logs in successfully as employee", async () => {
      mockUser = { uid: "firebase-uid-456", role: UserRole.EMPLOYEE };
      poolQuery.mockResolvedValueOnce({ rows: [sampleEmployeeRow] } as never);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe(UserRole.EMPLOYEE);
      expect(res.body.user.surname).toBeNull();
    });

    it("returns 404 when user is not found in database", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns 401 when token is missing", async () => {
      const res = await request(app).post("/api/v1/auth/login");
      expect(res.status).toBe(401);
    });

    it("returns 500 when database error occurs", async () => {
      poolQuery.mockRejectedValueOnce(new Error("Unexpected DB failure") as never);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .set("Authorization", "Bearer valid-token");

      expect(res.status).toBe(500);
      expect(res.body.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  describe("POST /api/v1/auth/register", () => {
    const validRegisterBody = {
      name: "John",
      surname: "Doe",
      email: "john.doe@example.com",
      mobile_number: "+391234567890",
      notes: "Vegetarian",
      emergency_contact: "+390987654321",
    };

    it("registers hiker successfully", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [sampleHikerRow] } as never);

      const res = await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", "Bearer token-123")
        .send(validRegisterBody);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Registration successful");
      expect(res.body.user.name).toBe("John");
    });

    it("rejects non-object body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", "Bearer token-123")
        .send("invalid string body");

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_REQUEST");
    });

    it("rejects missing required string fields", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", "Bearer token-123")
        .send({
          ...validRegisterBody,
          name: "",
        });

      expect(res.status).toBe(400);
    });

    it("rejects invalid optional string types", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", "Bearer token-123")
        .send({
          ...validRegisterBody,
          notes: 12345, // invalid type
        });

      expect(res.status).toBe(400);
    });

    it("handles conflict error when user already exists (409)", async () => {
      poolQuery.mockRejectedValueOnce({
        code: "23505", // Postgres unique_violation
        message: "duplicate key value",
      } as never);

      const res = await request(app)
        .post("/api/v1/auth/register")
        .set("Authorization", "Bearer token-123")
        .send(validRegisterBody);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONFLICT");
    });
  });
});
