import { TableAssignmentResult, TableAvailability } from "../types/reservationTypes";

export function assignTablesToParty(partySize: number, tables: TableAvailability[]): TableAssignmentResult[] {
    if (partySize <= 0) {
        throw new Error("INVALID_PARTY_SIZE");
    }

    // Considera solo i tavoli con almeno 1 posto libero
    const validTables = tables.filter((t) => t.freeSeats > 0);

    //caso 1: unico tavolo 
    const singleTables = validTables
        .filter((t) => t.freeSeats >= partySize)
        .sort((a, b) => a.freeSeats - b.freeSeats);  //ordinamento crescente per best fit

    if (singleTables.length > 0) {
        const bestTable = singleTables[0];
        return [
            {
                tableId: bestTable.tableId,
                tableNumber: bestTable.tableNumber,
                seatsAssigned: partySize,
            },
        ];
    }

    //caso 2: splitting su più tavoli
    const totalFreeSeats = validTables.reduce((sum, t) => sum + t.freeSeats, 0);
    if (totalFreeSeats < partySize) {
        throw new Error("INSUFFICIENT_CAPACITY");
    }

    const optimalCombination = findOptimalTableCombination(validTables, partySize);
    if (!optimalCombination) {
        throw new Error("INSUFFICIENT_CAPACITY");
    }

    //ordinamento per freeSeats decrescente per tenere il gruppo quanto più unito possibile
    optimalCombination.sort((a, b) => b.freeSeats - a.freeSeats);

    const assignments: TableAssignmentResult[] = [];
    let remainingToSeat = partySize;

    for (const table of optimalCombination) {
        if (remainingToSeat <= 0) break;
        const seatsToAssign = Math.min(table.freeSeats, remainingToSeat);
        assignments.push({
            tableId: table.tableId,
            tableNumber: table.tableNumber,
            seatsAssigned: seatsToAssign,
        });
        remainingToSeat -= seatsToAssign;
    }

    return assignments;
}


function findOptimalTableCombination(
    tables: TableAvailability[],
    partySize: number
): TableAvailability[] | null {
    for (let k = 2; k <= tables.length; k++) {
        const combinations = getKCombinations(tables, k);
        const validCombos = combinations.filter(
            (combo) => combo.reduce((sum, t) => sum + t.freeSeats, 0) >= partySize
        );

        if (validCombos.length > 0) {
            //combinazione che spreca meno posti in eccesso
            validCombos.sort((a, b) => {
                const sumA = a.reduce((sum, t) => sum + t.freeSeats, 0);
                const sumB = b.reduce((sum, t) => sum + t.freeSeats, 0);
                return sumA - sumB;
            });
            return validCombos[0];
        }
    }

    return null;
}

function getKCombinations<T>(array: T[], k: number): T[][] {
    if (k === 1) return array.map((item) => [item]);
    const combinations: T[][] = [];
    array.forEach((current, index) => {
        const smallerCombos = getKCombinations(array.slice(index + 1), k - 1);
        smallerCombos.forEach((combo) => combinations.push([current, ...combo]));
    });
    return combinations;
}