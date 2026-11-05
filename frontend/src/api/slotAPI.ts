import type {
    AvailableSlotDTO,
    CreateMealSlotDTO,
    MealSlotDTO,
    MealSlotDetailsDTO,
} from "../dto/SlotDTO";
import { ApiError, requestJSON } from "./request";

export function getSlots(): Promise<MealSlotDTO[]> {
    return requestJSON<MealSlotDTO[]>("/slots");
}

/** Capacity summary of every slot that has tables. The backend answers 404 when none exist. */
export async function getSlotCapacities(): Promise<AvailableSlotDTO[]> {
    try {
        return await requestJSON<AvailableSlotDTO[]>("/slots/available");
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) return [];
        throw err;
    }
}

export function getSlotDetails(slotId: string): Promise<MealSlotDetailsDTO> {
    return requestJSON<MealSlotDetailsDTO>(`/slots/${slotId}/details`);
}

export function createSlot(body: CreateMealSlotDTO): Promise<MealSlotDTO> {
    return requestJSON<MealSlotDTO>("/slots", "POST", body);
}

export function deleteSlot(slotId: string): Promise<{ message: string }> {
    return requestJSON(`/slots/${slotId}`, "DELETE");
}

export function addTableToSlot(slotId: string, diningTableId: string): Promise<unknown> {
    return requestJSON(`/slots/${slotId}/tables`, "POST", {
        dining_table_id: diningTableId,
    });
}

export function removeTableFromSlot(slotId: string, diningTableId: string): Promise<unknown> {
    return requestJSON(`/slots/${slotId}/tables/${diningTableId}`, "DELETE");
}
