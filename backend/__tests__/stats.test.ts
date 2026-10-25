import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../app";
import { pool } from "../connections/PostgreSQL/database";

jest.mock("../connections/PostgreSQL/database", () => ({
    pool: { query: jest.fn() },
    startServer: jest.fn(),
}));

const queryMock = pool.query as unknown as jest.Mock;

const JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
process.env.JWT_SECRET = JWT_SECRET;

const adminUser = {
    id: "admin-uuid-1",
    username: "admin",
    role: "ADMIN",
};

const operatorUser = {
    id: "operator-uuid-1",
    username: "operator1",
    role: "OPERATOR",
};

const fakeStats = [
    {
        service_type: "Account management",
        ticket_created: 10,
        ticket_served: 8,
        avg_elapsed_time: 120,
    },
    {
        service_type: "Billing support",
        ticket_created: 5,
        ticket_served: 4,
        avg_elapsed_time: 90,
    },
];

function generateToken(userId: string, role: string): string {
    return jwt.sign({ role }, JWT_SECRET, {
        subject: userId,
        expiresIn: "1h",
        algorithm: "HS256",
    });
}

describe("GET /api/v1/stats (See stats)", () => {
    beforeEach(() => {
        queryMock.mockReset();
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Authentication and Authorization Middleware", () => {
        it("returns 401 when Authorization header is missing", async () => {
            const res = await request(app).get("/api/v1/stats");

            expect(res.status).toBe(401);
            expect(res.body).toEqual({
                error: "Authorization header is missing or invalid",
            });
            expect(queryMock).not.toHaveBeenCalled();
        });

        it("returns 401 when Authorization header has invalid format", async () => {
            const res = await request(app)
                .get("/api/v1/stats")
                .set("Authorization", "Basic invalidtoken");

            expect(res.status).toBe(401);
            expect(res.body).toEqual({
                error: "Authorization header is missing or invalid",
            });
            expect(queryMock).not.toHaveBeenCalled();
        });

        it("returns 401 when token is invalid or expired", async () => {
            const res = await request(app)
                .get("/api/v1/stats")
                .set("Authorization", "Bearer invalid.token.payload");

            expect(res.status).toBe(401);
            expect(res.body).toEqual({
                error: "Invalid or expired token",
            });
        });

        it("returns 403 when user is authenticated but not an ADMIN (e.g. OPERATOR)", async () => {
            const operatorToken = generateToken(operatorUser.id, operatorUser.role);

            // Mock DB call in authenticateToken to return operator user
            queryMock.mockResolvedValueOnce({ rows: [operatorUser] });

            const res = await request(app)
                .get("/api/v1/stats")
                .set("Authorization", `Bearer ${operatorToken}`);

            expect(res.status).toBe(403);
            expect(res.body).toEqual({
                error: "Access denied: insufficient permissions",
            });
            // Only authenticateToken user lookup query was called, not stats query
            expect(queryMock).toHaveBeenCalledTimes(1);
        });
    });

    describe("Stats Controller logic", () => {
        const adminToken = generateToken(adminUser.id, adminUser.role);

        it("returns 200 with default aggregation (day) when query parameter is omitted", async () => {
            // 1st query: authenticateToken user lookup
            queryMock.mockResolvedValueOnce({ rows: [adminUser] });
            // 2nd query: stats calculation query
            queryMock.mockResolvedValueOnce({ rows: fakeStats });

            const res = await request(app)
                .get("/api/v1/stats")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(fakeStats);
            expect(queryMock).toHaveBeenCalledTimes(2);
            // Verify that default parameter $1 is 'day'
            expect(queryMock.mock.calls[1][1]).toEqual(["day"]);
        });

        it.each(["day", "week", "month"])(
            "returns 200 and passes '%s' aggregation to query",
            async (aggregation) => {
                queryMock.mockResolvedValueOnce({ rows: [adminUser] });
                queryMock.mockResolvedValueOnce({ rows: fakeStats });

                const res = await request(app)
                    .get(`/api/v1/stats?aggregation=${aggregation}`)
                    .set("Authorization", `Bearer ${adminToken}`);

                expect(res.status).toBe(200);
                expect(res.body).toEqual(fakeStats);
                expect(queryMock.mock.calls[1][1]).toEqual([aggregation]);
            }
        );

        it.each(["year", "hour", "all", "123", ""])(
            "returns 400 Bad Request for invalid aggregation '%s'",
            async (invalidAggregation) => {
                queryMock.mockResolvedValueOnce({ rows: [adminUser] });

                const res = await request(app)
                    .get(`/api/v1/stats?aggregation=${invalidAggregation}`)
                    .set("Authorization", `Bearer ${adminToken}`);

                expect(res.status).toBe(400);
                expect(res.body).toEqual({
                    error: "Invalid aggregation",
                });
                // Stats query should not be executed
                expect(queryMock).toHaveBeenCalledTimes(1);
            }
        );

        it("returns 500 when database query fails", async () => {
            queryMock.mockResolvedValueOnce({ rows: [adminUser] });
            queryMock.mockRejectedValueOnce(new Error("Database connection lost"));

            const res = await request(app)
                .get("/api/v1/stats?aggregation=day")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(500);
            expect(res.body).toEqual({
                error: "Internal server error",
            });
        });
    });
});
