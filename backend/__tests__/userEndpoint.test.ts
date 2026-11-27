import request from "supertest";
import app from "../app";
import { pool } from "../connections/PostgreSQL/database";
import { UserRepository } from "../repository/UserRepository";
import { UserRole } from "../types/UserRole";
import { InternalServerError } from "../errors/AppError";

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

const sampleUser = {
  id: "user-1",
  firebase_uid: "fb-1",
  name: "Mario",
  surname: "Rossi",
  email: "mario@example.com",
  mobile_number: "+39111",
  notes: null,
  emergency_contact: null,
  role: UserRole.HIKER,
};

const sampleWarden = {
  id: "warden-1",
  firebase_uid: "fb-warden",
  name: "Giuseppe",
  surname: null,
  email: "giuseppe@hut.com",
  mobile_number: null,
  notes: null,
  emergency_contact: null,
  role: UserRole.WARDEN,
};

describe("User Endpoints (/api/v1/users)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/users", () => {
    it("returns list of users", async () => {
      poolQuery.mockResolvedValueOnce({
        rows: [sampleUser, sampleWarden],
      } as never);

      const res = await request(app).get("/api/v1/users");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].role).toBe(UserRole.HIKER);
      expect(res.body[1].role).toBe(UserRole.WARDEN);
    });

    it("returns 404 when no users found", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);

      const res = await request(app).get("/api/v1/users");
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns 500 when database query fails", async () => {
      poolQuery.mockRejectedValueOnce(new Error("DB error") as never);

      const res = await request(app).get("/api/v1/users");
      expect(res.status).toBe(500);
    });
  });

  describe("GET /api/v1/users/:firebase_uid", () => {
    it("returns user by firebase_uid", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [sampleUser] } as never);

      const res = await request(app).get("/api/v1/users/fb-1");
      expect(res.status).toBe(200);
      expect(res.body.firebase_uid).toBe("fb-1");
    });

    it("returns 404 when user by firebase_uid is not found", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);

      const res = await request(app).get("/api/v1/users/non-existent");
      expect(res.status).toBe(404);
    });

    it("returns 500 when multiple users share same UID", async () => {
      poolQuery.mockResolvedValueOnce({
        rows: [sampleUser, sampleUser],
      } as never);

      const res = await request(app).get("/api/v1/users/duplicate-uid");
      expect(res.status).toBe(500);
    });

    it("handles whitespace or blank firebase_uid", async () => {
      const res = await request(app).get("/api/v1/users/%20");
      expect(res.status).toBe(500);
    });
  });

  describe("UserRepository Unit Tests", () => {
    const userRepo = new UserRepository();

    it("getUserById returns user when found", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [sampleUser] } as never);

      const user = await userRepo.getUserById({ id: sampleUser.id });
      expect(user.id).toBe(sampleUser.id);
    });

    it("getUserById throws NotFoundError when not found", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);

      await expect(userRepo.getUserById({ id: "missing" })).rejects.toThrow(
        "User not found",
      );
    });

    it("throws InternalServerError when stored hiker has missing surname", async () => {
      poolQuery.mockResolvedValueOnce({
        rows: [{ ...sampleUser, surname: null }],
      } as never);

      await expect(userRepo.getUserById({ id: "hiker-bad" })).rejects.toThrow(
        InternalServerError,
      );
    });

    it("throws InternalServerError when stored user has unsupported role", async () => {
      poolQuery.mockResolvedValueOnce({
        rows: [{ ...sampleUser, role: "ALIEN" }],
      } as never);

      await expect(userRepo.getUserById({ id: "alien" })).rejects.toThrow(
        "The stored user has an unsupported role.",
      );
    });

    it("createHiker throws when database returns empty row", async () => {
      poolQuery.mockResolvedValueOnce({ rows: [] } as never);

      await expect(
        userRepo.createHiker({
          user: {
            firebase_uid: "uid",
            name: "Test",
            surname: "Hiker",
            email: "test@hiker.com",
            mobile_number: "+123",
            role: UserRole.HIKER,
          },
        }),
      ).rejects.toThrow(InternalServerError);
    });

    it("createHiker throws when returned user does not have HIKER role", async () => {
      poolQuery.mockResolvedValueOnce({
        rows: [{ ...sampleUser, role: UserRole.EMPLOYEE }],
      } as never);

      await expect(
        userRepo.createHiker({
          user: {
            firebase_uid: "uid",
            name: "Test",
            surname: "Hiker",
            email: "test@hiker.com",
            mobile_number: "+123",
            role: UserRole.HIKER,
          },
        }),
      ).rejects.toThrow("The created user does not have the HIKER role.");
    });
  });
});
