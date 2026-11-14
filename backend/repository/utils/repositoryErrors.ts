import {
  AppError,
  ConflictError,
  InternalServerError,
  InvalidRequestError,
} from "../../errors/AppError";

/** Preserve application errors and translate PostgreSQL errors consistently. */
export function throwRepositoryError(
  error: unknown,
  failureMessage: string,
  duplicateMessage = "A resource with these values already exists.",
): never {
  if (error instanceof AppError) {
    throw error;
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined;

  if (code === "23505") {
    throw new ConflictError(duplicateMessage);
  }

  if (code === "23503") {
    throw new ConflictError(
      "The operation conflicts with related records that still reference this resource.",
    );
  }

  if (
    ["22P02", "22003", "22007", "22008", "23502", "23514"].includes(
      String(code),
    )
  ) {
    throw new InvalidRequestError(
      "The request contains an invalid identifier, date, time, or numeric value.",
    );
  }

  console.error(failureMessage, error);
  throw new InternalServerError(failureMessage);
}
