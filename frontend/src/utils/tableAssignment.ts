// Same algorithm as backend/utils/tableAssignment.ts

export interface TableFreeSeats {
    tableId: string;
    tableNumber: number;
    freeSeats: number;
}

export interface TableAssignment {
    tableId: string;
    tableNumber: number;
    seatsAssigned: number;
}

// Returns null if the party does not fit
export function assignTablesToParty(
    partySize: number,
    tables: TableFreeSeats[]
): TableAssignment[] | null {
    if (partySize <= 0) {
        return null;
    }

    const validTables = tables.filter((t) => t.freeSeats > 0);

    // Case 1: a single table (best fit)
    const singleTable = validTables
        .filter((t) => t.freeSeats >= partySize)
        .sort((a, b) => a.freeSeats - b.freeSeats)[0];

    if (singleTable) {
        return [{
            tableId: singleTable.tableId,
            tableNumber: singleTable.tableNumber,
            seatsAssigned: partySize
        }];
    }

    // Case 2: split over the fewest tables
    const totalFreeSeats = validTables.reduce((sum, t) => sum + t.freeSeats, 0);

    if (totalFreeSeats < partySize) {
        return null;
    }

    const combination = findOptimalTableCombination(validTables, partySize);

    if (!combination) {
        return null;
    }

    // Largest tables first
    combination.sort((a, b) => b.freeSeats - a.freeSeats);

    const assignments: TableAssignment[] = [];
    let remaining = partySize;

    for (const table of combination) {
        if (remaining <= 0) {
            break;
        }

        const seats = Math.min(table.freeSeats, remaining);

        assignments.push({ tableId: table.tableId, tableNumber: table.tableNumber, seatsAssigned: seats });
        remaining -= seats;
    }

    return assignments;
}

// Fewest tables, then fewest wasted seats
function findOptimalTableCombination(
    tables: TableFreeSeats[],
    partySize: number
): TableFreeSeats[] | null {
    for (let k = 2; k <= tables.length; k++) {
        const validCombos = getKCombinations(tables, k)
            .filter((combo) => sumFreeSeats(combo) >= partySize)
            .sort((a, b) => sumFreeSeats(a) - sumFreeSeats(b));

        if (validCombos.length > 0) {
            return validCombos[0];
        }
    }

    return null;
}

function sumFreeSeats(tables: TableFreeSeats[]): number {
    return tables.reduce((sum, t) => sum + t.freeSeats, 0);
}

function getKCombinations<T>(array: T[], k: number): T[][] {
    if (k === 1) {
        return array.map((item) => [item]);
    }

    const combinations: T[][] = [];

    array.forEach((current, index) => {
        getKCombinations(array.slice(index + 1), k - 1)
            .forEach((combo) => combinations.push([current, ...combo]));
    });

    return combinations;
}
