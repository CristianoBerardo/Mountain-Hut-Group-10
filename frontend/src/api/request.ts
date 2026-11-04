// Throws with the backend's error message and status code
export async function requestJSON<T>(
    url: string,
    method: string = "GET",
    body?: unknown
): Promise<T> {

    const response = await fetch(url, {
        method,
        headers: body !== undefined
            ? { "Content-Type": "application/json" }
            : undefined,
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
