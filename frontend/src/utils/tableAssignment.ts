/**
 * Table assignment for a party (MH-01).
 *
 * Same algorithm as backend/utils/tableAssignment.ts on staging, which has no
 * reservation endpoint yet, so the booking page has to assign tables itself:
 *  1. seat the whole party at the single table with the fewest free seats that
 *     still fits it (tables are shared with other parties);
 *  2. otherwise split the party over as few tables as possible, choosing the
 *     combination that wastes the fewest seats, filling the largest tables first.
 */

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

/**
 * @returns The seats to take on each table, or null if the party does not fit.
 */
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

    // Largest tables first, to keep the party as together as possible
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

/**
 * Smallest number of tables first; among those, the combination with the
 * fewest free seats in total (i.e. the fewest wasted seats).
 */
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
