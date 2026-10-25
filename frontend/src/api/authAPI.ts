import type {
    UserLoginDTO,
    UserLoginResponseDTO,
} from "../dto/UserDTO";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/auth`;

/**
 * Creates a new ticket for the selected service.
 *
 * @param ticketData - Ticket information.
 * @returns The created ticket.
 */
export async function loginUser(
    user_data: UserLoginDTO
): Promise<UserLoginResponseDTO> {    

    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user_data)
    });

     if (!response.ok) {
        throw new Error(`Failed to login user (${response.status})`);
    }

    return response.json();
}