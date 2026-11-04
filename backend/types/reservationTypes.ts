import { MealReservationStatus } from "./MealReservationStatus";

export interface TableAvailability {
    tableId: string;
    tableNumber: number;
    totalCapacity: number;
    occupiedSeats: number;
    freeSeats: number;
}

export interface TableAssignmentResult {
    tableId: string;
    tableNumber: number;
    seatsAssigned: number;
}

export interface CreateMealReservationDTO {
    hikerId: string;
    startsAt: string;
    endsAt?: string;
    partySize: number;
}

export interface MealReservationResponse {
    id: string;
    hikerId: string;
    startsAt: Date;
    endsAt: Date;
    partySize: number;
    status: MealReservationStatus;
    createdAt: Date;
    assignedTables: TableAssignmentResult[];
}