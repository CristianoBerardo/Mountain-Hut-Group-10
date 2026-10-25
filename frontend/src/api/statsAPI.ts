import type {
    AggregationType,
    StatsDTO,
} from "../dto/StatsDTO";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/stats`;

/**
 * Creates a new ticket for the selected service.
 *
 * @param ticketData - Ticket information.
 * @returns The created ticket.
 */
export async function getStats(
    aggregation: AggregationType
): Promise<StatsDTO[]> {

    const token = sessionStorage.getItem("jwt_token");

    if (!token) {
        throw new Error("You must log in to view statistics");
    }

    const response = await fetch(`${API_BASE_URL}?aggregation=${aggregation}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
    }

    if (response.status === 403) {
        throw new Error("You do not have permission to view statistics.");
    }

    if (!response.ok) {
        throw new Error(`Failed to load statistics (${response.status})`);
    }

    return response.json();
}