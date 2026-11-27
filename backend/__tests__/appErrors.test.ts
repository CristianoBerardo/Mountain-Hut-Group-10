import {
  AppError,
  NotFoundError,
  InternalServerError,
  EmailConfigurationError,
  TokenMissingOrInvalidError,
  InsufficientPermissionsError,
  InvalidRequestError,
  ConflictError,
  InsufficientCapacityError,
} from "../errors/AppError";

describe("AppError Classes", () => {
  it("instantiates AppError base class", () => {
    const error = new AppError(418, "IM_A_TEAPOT", "Teapot error");
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe("IM_A_TEAPOT");
    expect(error.message).toBe("Teapot error");
    expect(error.name).toBe("AppError");
  });

  it("instantiates NotFoundError with default and custom description", () => {
    const defaultErr = new NotFoundError();
    expect(defaultErr.statusCode).toBe(404);
    expect(defaultErr.code).toBe("NOT_FOUND");
    expect(defaultErr.message).toBe("Not Found");

    const customErr = new NotFoundError("Item not found");
    expect(customErr.message).toBe("Item not found");
  });

  it("instantiates InternalServerError with default and custom description", () => {
    const defaultErr = new InternalServerError();
    expect(defaultErr.statusCode).toBe(500);
    expect(defaultErr.code).toBe("INTERNAL_SERVER_ERROR");
    expect(defaultErr.message).toBe("Internal Server Error");

    const customErr = new InternalServerError("DB crash");
    expect(customErr.message).toBe("DB crash");
  });

  it("instantiates EmailConfigurationError with default and custom description", () => {
    const defaultErr = new EmailConfigurationError();
    expect(defaultErr.statusCode).toBe(500);
    expect(defaultErr.code).toBe("EMAIL_CONFIGURATION_ERROR");

    const customErr = new EmailConfigurationError("SMTP failed");
    expect(customErr.message).toBe("SMTP failed");
  });

  it("instantiates TokenMissingOrInvalidError with default and custom description", () => {
    const defaultErr = new TokenMissingOrInvalidError();
    expect(defaultErr.statusCode).toBe(401);
    expect(defaultErr.code).toBe("TOKEN_MISSING_INVALID");

    const customErr = new TokenMissingOrInvalidError("Bad token");
    expect(customErr.message).toBe("Bad token");
  });

  it("instantiates InsufficientPermissionsError with default and custom description", () => {
    const defaultErr = new InsufficientPermissionsError();
    expect(defaultErr.statusCode).toBe(403);
    expect(defaultErr.code).toBe("INSUFFICIENT_PERMISSIONS");

    const customErr = new InsufficientPermissionsError("Need admin");
    expect(customErr.message).toBe("Need admin");
  });

  it("instantiates InvalidRequestError with default and custom description", () => {
    const defaultErr = new InvalidRequestError();
    expect(defaultErr.statusCode).toBe(400);
    expect(defaultErr.code).toBe("INVALID_REQUEST");

    const customErr = new InvalidRequestError("Invalid input");
    expect(customErr.message).toBe("Invalid input");
  });

  it("instantiates ConflictError with default and custom description", () => {
    const defaultErr = new ConflictError();
    expect(defaultErr.statusCode).toBe(409);
    expect(defaultErr.code).toBe("CONFLICT");

    const customErr = new ConflictError("Already exists");
    expect(customErr.message).toBe("Already exists");
  });

  it("instantiates InsufficientCapacityError with default and custom description", () => {
    const defaultErr = new InsufficientCapacityError();
    expect(defaultErr.statusCode).toBe(409);
    expect(defaultErr.code).toBe("INSUFFICIENT_CAPACITY");

    const customErr = new InsufficientCapacityError("No seats");
    expect(customErr.message).toBe("No seats");
  });
});
