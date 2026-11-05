import type { CreateDiningTableDTO, DiningTableDTO } from "../dto/TableDTO";
import { requestJSON } from "./request";

export function getActiveTables(): Promise<DiningTableDTO[]> {
    return requestJSON<DiningTableDTO[]>("/tables?active=true");
}

export function createTable(body: CreateDiningTableDTO): Promise<DiningTableDTO> {
    return requestJSON<DiningTableDTO>("/tables", "POST", body);
}
