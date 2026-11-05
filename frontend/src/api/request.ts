const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1`;

/**
 * Performs a JSON request against the backend API (`path` is relative to /api/v1).
 * Attaches the Firebase JWT stored at login (if any) as a Bearer token and
 * throws an ApiError carrying the backend's error message and status code.
 */
export async function requestJSON<T>(
    path: string,
    method: string = "GET",
    body?: unknown,
): Promise<T> {
    const headers: Record<string, string> = {};

    // Send the Firebase JWT saved at login, required by protected endpoints
    const token = sessionStorage.getItem("jwt_token");
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            data && typeof data.error === "string" ? data.error : "Request failed";
        throw new ApiError(message, response.status);
    }

    return data as T;
}

export class ApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}
