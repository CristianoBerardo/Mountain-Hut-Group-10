import request from "supertest";
import app from "../app";
import { pool } from "../connections/PostgreSQL/database";

jest.mock("../connections/PostgreSQL/database", () => ({
    pool: { query: jest.fn() },
    startServer: jest.fn(),
}));

const queryMock = pool.query as unknown as jest.Mock;

const fakeTicket = {
    id: "3b241101-e2bb-4255-8caf-4136c566a962",
    code: "D001",
    service_type: "Technical assistance",
    status: "QUEUE",
    creation_date: "2026-10-12T08:00:00.000Z",
    expiration_date: null,
};

describe("POST /api/tickets (Get a ticket)", () => {
    beforeEach(() => {
        queryMock.mockReset(); // per resettare il nostro database fake
        jest.spyOn(console, "error").mockImplementation(() => { }); // disattiva i console error
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("creates first ticket of the day with code D001 and replies 201", async () => {
        queryMock
            .mockResolvedValueOnce({ rows: [] }) // nessun ticket creato oggi per questo servizio
            .mockResolvedValueOnce({ rows: [fakeTicket] }); // insert del ticket

        const res = await request(app)
            .post("/api/tickets")
            .send({ service_type: "Technical assistance" });

        expect(res.status).toBe(201);
        expect(res.body).toEqual(fakeTicket);
        expect(res.body.status).toBe("QUEUE");
        expect(res.body.expiration_date).toBeNull();
        expect(queryMock.mock.calls[1][1]).toEqual([
            "D001",
            "Technical assistance",
            "QUEUE",
        ]);
    });

    it("generates progressive code incrementing previous ticket number", async () => {
        queryMock
            .mockResolvedValueOnce({ rows: [{ code: "D009" }] }) // ultimo ticket di oggi era D009
            .mockResolvedValueOnce({ rows: [{ ...fakeTicket, code: "D010" }] });

        const res = await request(app)
            .post("/api/tickets")
            .send({ service_type: "Technical assistance" });

        expect(res.status).toBe(201);
        expect(queryMock.mock.calls[1][1][0]).toBe("D010");
    });

    it("uses service-specific prefix (e.g. B for Billing support)", async () => {
        queryMock
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ ...fakeTicket, code: "B001", service_type: "Billing support" }] });

        await request(app)
            .post("/api/tickets")
            .send({ service_type: "Billing support" });

        expect(queryMock.mock.calls[1][1][0]).toBe("B001");
        expect(queryMock.mock.calls[1][1][1]).toBe("Billing support");
    });

    it("restarts at 0 when max ticket number (999) is reached", async () => {
        queryMock
            .mockResolvedValueOnce({ rows: [{ code: "B999" }] })
            .mockResolvedValueOnce({ rows: [{ ...fakeTicket, code: "B000", service_type: "Billing support" }] });

        await request(app)
            .post("/api/tickets")
            .send({ service_type: "Billing support" });

        expect(queryMock.mock.calls[1][1][0]).toBe("B000");
    });

    it("remove spaces from service_type before saving", async () => {
        queryMock
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ ...fakeTicket, code: "B001", service_type: "Billing support" }] });

        await request(app)
            .post("/api/tickets")
            .send({ service_type: "  Billing support  " });

        expect(queryMock.mock.calls[1][1][1]).toBe("Billing support");
    });

    it.each([
        ["empty body", {}],
        ["empty service_type", { service_type: "" }],
        ["service_type with spaces only", { service_type: "   " }],
        ["numeric service_type", { service_type: 42 }],
        ["service_type null", { service_type: null }],
    ])("It responds 400 with %s and does not touch the database.", async (_name, body) => {
        const res = await request(app).post("/api/tickets").send(body);

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "service_type is required" });
        expect(queryMock).not.toHaveBeenCalled();
    });

    it("returns 500 if the database fails", async () => {
        queryMock.mockRejectedValueOnce(new Error("db down"));

        const res = await request(app)
            .post("/api/tickets")
            .send({ service_type: "Technical assistance" });

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "Internal server error" });
    });
});

describe("GET /api/tickets/:id", () => {
    beforeEach(() => {
        queryMock.mockReset();
    });

    it("returns the ticket if it exists", async () => {
        queryMock.mockResolvedValueOnce({ rows: [fakeTicket] });

        const res = await request(app).get(`/api/tickets/${fakeTicket.id}`);

        expect(res.status).toBe(200);
        expect(res.body.code).toBe("D001");
    });

    it("responds 404 if it does not exist", async () => {
        queryMock.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get(`/api/tickets/${fakeTicket.id}`);

        expect(res.status).toBe(404);
    });
});