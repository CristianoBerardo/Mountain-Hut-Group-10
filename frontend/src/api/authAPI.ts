import type {
    UserLoginResponseDTO,
    UserRegisterDTO
} from "../dto/UserDTO";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/auth`;

/**
 * Creates a new ticket for the selected service.
 *
 * @param ticketData - Ticket information.
 * @returns The created ticket.
 */
export async function loginUser(
    token: string,
): Promise<UserLoginResponseDTO> {    

    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
    });

     if (!response.ok) {
        throw new Error(`Failed to login user (${response.status})`);
    }

    return response.json();
}

export async function registerUser(
    token: string,
    body: UserRegisterDTO,
): Promise<UserLoginResponseDTO> {    

    const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

     if (!response.ok) {
        throw new Error(`Failed to register user (${response.status})`);
    }

    return response.json();
}