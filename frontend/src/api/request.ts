/**
 * Sends a JSON request and returns the parsed response body.
 *
 * On failure, throws an Error carrying the backend's `error` message
 * (e.g. "Table number already exists") together with the status code.
 *
 * @param url - Endpoint URL.
 * @param method - HTTP method.
 * @param body - Optional JSON body.
 * @returns The parsed response body.
 */
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
