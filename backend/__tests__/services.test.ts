import { pool } from "../connections/PostgreSQL/database";
import {
  createReservation,
  ReservationBusinessError,
} from "../services/reservationService";
import { getTablesAvailability } from "../services/tableAvailabilityService";
import { InsufficientCapacityError } from "../errors/AppError";

jest.mock("../connections/PostgreSQL/database", () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
  },
}));

describe("Reservation and Table Availability Services", () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  describe("createReservation service", () => {
    const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();

    it("rejects non-positive party size", async () => {
      await expect(
        createReservation({
          hikerId: "hiker-1",
          partySize: 0,
          startsAt: futureDate,
        }),
      ).rejects.toThrow("Party size must be greater than zero.");
    });

    it("rejects invalid startsAt format", async () => {
      await expect(
        createReservation({
          hikerId: "hiker-1",
          partySize: 2,
          startsAt: "invalid-date",
        }),
      ).rejects.toThrow("Invalid start date/time format.");
    });

    it("rejects when endsAt is before or equal to startsAt", async () => {
      const now = new Date(Date.now() + 5 * 60 * 60 * 1000);
      const earlier = new Date(now.getTime() - 60 * 1000).toISOString();

      await expect(
        createReservation({
          hikerId: "hiker-1",
          partySize: 2,
          startsAt: now.toISOString(),
          endsAt: earlier,
        }),
      ).rejects.toThrow("End time must be after start time.");
    });

    it("rejects reservation when start time is less than 2 hours in the future", async () => {
      const tooSoon = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      await expect(
        createReservation({
          hikerId: "hiker-1",
          partySize: 2,
          startsAt: tooSoon,
        }),
      ).rejects.toThrow(
        "Reservations must be placed at least 2 hours before the service start time.",
      );
    });

    it("rejects when user has an overlapping confirmed reservation (409)", async () => {
      // BEGIN
      mockClient.query.mockResolvedValueOnce({});
      // overlap check -> found 1 existing
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: "existing-res-1" }] });
      // ROLLBACK
      mockClient.query.mockResolvedValueOnce({});

      await expect(
        createReservation({
          hikerId: "hiker-1",
          partySize: 2,
          startsAt: futureDate,
        }),
      ).rejects.toThrow(
        "You already have a confirmed reservation for this time window.",
      );
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("creates reservation successfully when tables are available", async () => {
      // 1. BEGIN
      mockClient.query.mockResolvedValueOnce({});
      // 2. Overlap check -> 0 rows
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // 3. getTablesAvailability -> returns table with free seats
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            table_id: "t1",
            table_number: 1,
            total_capacity: 4,
            occupied_seats: 0,
            free_seats: 4,
          },
        ],
      });
      // 4. INSERT meal_reservation
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: "res-new-1",
            hiker_id: "hiker-1",
            starts_at: futureDate,
            ends_at: futureDate,
            party_size: 2,
            status: "CONFIRMED",
            created_at: new Date().toISOString(),
          },
        ],
      });
      // 5. INSERT reservation_table
      mockClient.query.mockResolvedValueOnce({});
      // 6. COMMIT
      mockClient.query.mockResolvedValueOnce({});

      const result = await createReservation({
        hikerId: "hiker-1",
        partySize: 2,
        startsAt: futureDate,
      });

      expect(result.id).toBe("res-new-1");
      expect(result.assignedTables).toHaveLength(1);
      expect(result.assignedTables[0].tableNumber).toBe(1);
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("rolls back transaction when table assignment fails", async () => {
      // 1. BEGIN
      mockClient.query.mockResolvedValueOnce({});
      // 2. Overlap check -> 0 rows
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // 3. getTablesAvailability -> no free tables
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            table_id: "t1",
            table_number: 1,
            total_capacity: 2,
            occupied_seats: 2,
            free_seats: 0,
          },
        ],
      });
      // ROLLBACK
      mockClient.query.mockResolvedValueOnce({});

      await expect(
        createReservation({
          hikerId: "hiker-1",
          partySize: 4,
          startsAt: futureDate,
        }),
      ).rejects.toThrow(ReservationBusinessError);
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });
  });

  describe("getTablesAvailability service", () => {
    it("executes query and maps TableAvailability records", async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            table_id: "tbl-1",
            table_number: 5,
            total_capacity: 6,
            occupied_seats: 2,
            free_seats: 4,
          },
        ],
      });

      const start = new Date();
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const tables = await getTablesAvailability(mockClient, start, end);

      expect(tables).toHaveLength(1);
      expect(tables[0]).toEqual({
        tableId: "tbl-1",
        tableNumber: 5,
        totalCapacity: 6,
        occupiedSeats: 2,
        freeSeats: 4,
      });
    });
  });
});
