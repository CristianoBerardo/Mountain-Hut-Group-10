import { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
): void => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error(error);
    }

    res.status(error.statusCode).json({
      code: error.code,
      error: error.message,
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    error: "Internal server error",
  });
};
