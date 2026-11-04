import type { AvailableSlotDTO } from "../dto/SlotDTO";
import { requestJSON } from "./request";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/slots`;

export async function getAvailableSlots(): Promise<AvailableSlotDTO[]> {
    return requestJSON<AvailableSlotDTO[]>(`${API_BASE_URL}/available`);
}
