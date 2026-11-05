import { assignTablesToParty } from "../utils/tableAssignment";
import { TableAvailability } from "../types/reservationTypes";

const tables: TableAvailability[] = [
  {
    tableId: "table-1",
    tableNumber: 1,
    totalCapacity: 2,
    occupiedSeats: 0,
    freeSeats: 2,
  },
  {
    tableId: "table-2",
    tableNumber: 2,
    totalCapacity: 4,
    occupiedSeats: 0,
    freeSeats: 4,
  },
  {
    tableId: "table-3",
    tableNumber: 3,
    totalCapacity: 6,
    occupiedSeats: 0,
    freeSeats: 6,
  },
];

describe("assignTablesToParty", () => {
  it("seats the whole party at the smallest table that fits", () => {
    expect(assignTablesToParty(3, tables)).toEqual([
      {
        tableId: "table-2",
        tableNumber: 2,
        seatsAssigned: 3,
      },
    ]);
  });

  it("chooses the best fit when multiple individual tables can seat the party", () => {
    expect(assignTablesToParty(1, tables)).toEqual([
      {
        tableId: "table-1",
        tableNumber: 1,
        seatsAssigned: 1,
      },
    ]);
  });

  it("uses the smallest table combination that can seat a split party", () => {
    const splitTables = [
      { ...tables[0], freeSeats: 3 },
      { ...tables[1], freeSeats: 5 },
      { ...tables[2], freeSeats: 6 },
    ];
    const result = assignTablesToParty(8, splitTables);

    expect(result).toEqual([
      {
        tableId: "table-2",
        tableNumber: 2,
        seatsAssigned: 5,
      },
      {
        tableId: "table-1",
        tableNumber: 1,
        seatsAssigned: 3,
      },
    ]);
    expect(result.reduce((sum, assignment) => sum + assignment.seatsAssigned, 0))
      .toBe(8);
  });

  it("searches combinations of three tables when no pair has enough seats", () => {
    const smallTables = [
      { ...tables[0], freeSeats: 2 },
      { ...tables[1], freeSeats: 3 },
      { ...tables[2], freeSeats: 4 },
    ];

    expect(assignTablesToParty(9, smallTables)).toEqual([
      { tableId: "table-3", tableNumber: 3, seatsAssigned: 4 },
      { tableId: "table-2", tableNumber: 2, seatsAssigned: 3 },
      { tableId: "table-1", tableNumber: 1, seatsAssigned: 2 },
    ]);
  });

  it("throws when the available seats are insufficient", () => {
    expect(() => assignTablesToParty(13, tables)).toThrow(
      "INSUFFICIENT_CAPACITY",
    );
  });

  it("throws when party size is not positive", () => {
    expect(() => assignTablesToParty(0, tables)).toThrow("INVALID_PARTY_SIZE");
    expect(() => assignTablesToParty(-1, tables)).toThrow(
      "INVALID_PARTY_SIZE",
    );
    expect(() => assignTablesToParty(1.5, tables)).toThrow(
      "INVALID_PARTY_SIZE",
    );
  });

  it("does not assign tables with no free seats", () => {
    const fullTables = tables.map((table) => ({ ...table, freeSeats: 0 }));

    expect(() => assignTablesToParty(1, fullTables)).toThrow(
      "INSUFFICIENT_CAPACITY",
    );
  });
});
