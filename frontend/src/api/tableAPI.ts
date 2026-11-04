import type {
    TableDTO,
    TableFilters,
    TableInputDTO
} from "../dto/TableDTO";
import { requestJSON } from "./request";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/tables`;

export async function getTables(filters: TableFilters = {}): Promise<TableDTO[]> {
    const params = new URLSearchParams();

    if (filters.active !== undefined) {
        params.set("active", String(filters.active));
    }

    if (filters.available) {
        params.set("available", "true");
    }

    const query = params.toString();

    return requestJSON<TableDTO[]>(query ? `${API_BASE_URL}?${query}` : API_BASE_URL);
}

export async function updateTable(id: string, table: TableInputDTO): Promise<TableDTO> {
    return requestJSON<TableDTO>(`${API_BASE_URL}/${encodeURIComponent(id)}`, "PATCH", table);
}
