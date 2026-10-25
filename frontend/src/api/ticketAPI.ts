import type {
    CreateTicketDTO,
    TicketDTO
} from "../dto/TicketDTO";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/tickets`;

/**
 * Creates a new ticket for the selected service.
 *
 * @param ticketData - Ticket information.
 * @returns The created ticket.
 */
export async function createTicket(
    ticketData: CreateTicketDTO
): Promise<TicketDTO> {

    const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(ticketData)
    });

    if (!response.ok) {
        if (response.status === 400) {
            throw new Error("Invalid service type");
        }

        if (response.status === 401) {
            throw new Error("Authentication required");
        }

        if (response.status === 403) {
            throw new Error("Not authorized to create tickets");
        }

        throw new Error(`Failed to create ticket (${response.status})`);
    }

    return response.json();
}