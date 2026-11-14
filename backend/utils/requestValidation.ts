import { InvalidRequestError } from "../errors/AppError";

/** Accept only JSON objects before reading request fields. */
export function requestObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InvalidRequestError("The request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

export function requiredString(value: unknown, field: string): string {
  if (value === undefined || value === null || value === "") {
    throw new InvalidRequestError(`${field} is required`);
  }
  if (typeof value !== "string") {
    throw new InvalidRequestError(`${field} must be a string`);
  }
  if (value.trim().length === 0) {
    throw new InvalidRequestError(`${field} is required`);
  }
  return value.trim();
}

export function positiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new InvalidRequestError(`${field} must be a positive integer`);
  }
  return value;
}

export function nonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InvalidRequestError(`${field} must be a non-negative integer`);
  }
  return value;
}

export function booleanValue(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new InvalidRequestError(`${field} must be a boolean`);
  }
  return value;
}

/** Parse query flags explicitly rather than treating arbitrary strings as false. */
export function booleanQuery(
  value: unknown,
  field: string,
): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new InvalidRequestError(`${field} must be true or false`);
}
