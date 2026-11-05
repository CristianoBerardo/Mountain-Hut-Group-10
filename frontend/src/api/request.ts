// Throws with the backend's error message and status code
export async function requestJSON<T>(
    url: string,
    method: string = "GET",
    body?: unknown
): Promise<T> {

    const headers: Record<string, string> = {};

    // Send the Firebase JWT saved at login, required by protected endpoints
    const token = sessionStorage.getItem("jwt_token");
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message = data && typeof data.error === "string"
            ? data.error
            : "Request failed";

        throw new Error(`${message} (${response.status})`);
    }

    return data as T;
}
