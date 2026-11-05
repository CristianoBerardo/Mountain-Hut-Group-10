import type { DiningTableDTO } from "../dto/TableDTO";
import { requestJSON } from "./request";

export function getActiveTables(): Promise<DiningTableDTO[]> {
    return requestJSON<DiningTableDTO[]>("/tables?active=true");
}
