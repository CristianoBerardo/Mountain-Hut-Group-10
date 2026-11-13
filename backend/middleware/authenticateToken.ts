import { NextFunction, Request, Response } from "express";
import { adminAuth } from "../config/firebaseAdmin";
import {
  AppError,
  InternalServerError,
  TokenMissingOrInvalidError,
} from "../errors/AppError";

// Invalid credentials are client errors; Firebase service failures remain 500s.
const invalidTokenCodes = new Set([
  "auth/argument-error",
  "auth/invalid-argument",
  "auth/invalid-id-token",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/user-disabled",
  "auth/user-not-found",
]);

/** Verify the Firebase ID token and expose its claims to subsequent handlers. */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const match = req.headers.authorization?.match(/^Bearer[ \t]+(\S+)$/i);

    if (!match) {
      throw new TokenMissingOrInvalidError();
    }

    res.locals.user = await adminAuth.verifyIdToken(match[1]);
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string" &&
      invalidTokenCodes.has(error.code)
    ) {
      next(new TokenMissingOrInvalidError());
      return;
    }

    console.error("Token verification failed:", error);
    next(
      new InternalServerError("Unable to verify the authentication token."),
    );
  }
}
