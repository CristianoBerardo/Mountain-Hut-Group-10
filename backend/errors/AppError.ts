export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(description: string = "Not Found") {
    super(404, "NOT_FOUND", description);
  }
}

export class InternalServerError extends AppError {
  constructor(description: string = "Internal Server Error") {
    super(500, "INTERNAL_SERVER_ERROR", description);
  }
}

export class TokenMissingOrInvalidError extends AppError {
  constructor() {
    super(
      401,
      "TOKEN_MISSING_INVALID",
      "Authorization header is missing or invalid",
    );
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor() {
    super(
      403,
      "INSUFFICIENT_PERMISSIONS",
      "Access denied: insufficient permissions",
    );
  }
}

export class InvalidRequestError extends AppError {
  constructor(description: string = "Invalid Request") {
    super(400, "INVALID_REQUEST", description);
  }
}

export class ConflictError extends AppError {
  constructor(description: string = "Conflict") {
    super(409, "CONFLICT", description);
  }
}
