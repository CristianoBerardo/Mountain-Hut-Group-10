import { NextFunction, Request, Response } from "express";
import { adminAuth } from "../config/firebaseAdmin";
import {
  AppError,
  InternalServerError,
  InvalidRequestError,
  NotFoundError,
  TokenMissingOrInvalidError,
} from "../errors/AppError";
import { UserRepository } from "../repository/UserRepository";
import { createHikerDTO, UserDTO } from "../types/UserDTOType";
import { UserRole } from "../types/UserRole";

export class AuthController {
  private readonly userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async loginUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Authentication is performed once by authenticateToken before this handler.
      const { firebaseUid, token } = this.getAuthenticationContext(req, res);
      const user = await this.userRepository.getUserByFirebaseUid({
        firebase_uid: firebaseUid,
      });

      // Updating custom claims does not return or refresh an ID token.
      // The client must call getIdToken(true) to receive the updated role claim.
      await adminAuth.setCustomUserClaims(firebaseUid, { role: user.role });

      res.status(200).json({
        message: "Login successful",
        token,
        user: this.toAuthUserResponse(user),
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        next(
          new NotFoundError(
            "No registered user was found for this Firebase account.",
          ),
        );
        return;
      }

      if (error instanceof AppError) {
        next(error);
        return;
      }

      console.error("Login failed:", error);
      next(
        new InternalServerError("Unable to log in. Please try again later."),
      );
    }
  }

  async registerUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { firebaseUid, token } = this.getAuthenticationContext(req, res);
      const body: unknown = req.body;

      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new InvalidRequestError(
          "The request body must be a JSON object.",
        );
      }

      const data = body as Record<string, unknown>;

      // Identity and role are determined by the server, never by request fields.
      const newUser: createHikerDTO = {
        firebase_uid: firebaseUid,
        name: this.requiredString(data, "name"),
        surname: this.requiredString(data, "surname"),
        email: this.requiredString(data, "email"),
        mobile_number: this.requiredString(data, "mobile_number"),
        notes: this.optionalString(data, "notes"),
        emergency_contact: this.optionalString(data, "emergency_contact"),
        role: UserRole.HIKER,
      };

      const user = await this.userRepository.createHiker({ user: newUser });

      // Keep the existing response status and field names used by the frontend.
      res.status(200).json({
        message: "Registration successful",
        token,
        user: this.toAuthUserResponse(user),
      });
    } catch (error) {
      // Preserve repository errors, including conflicts, for the shared handler.
      if (error instanceof AppError) {
        next(error);
        return;
      }

      console.error("Registration failed:", error);
      next(
        new InternalServerError(
          "Unable to register the hiker. Please try again later.",
        ),
      );
    }
  }

  private getAuthenticationContext(
    req: Request,
    res: Response,
  ): { firebaseUid: string; token: string } {
    const match = req.headers.authorization?.match(/^Bearer[ \t]+(\S+)$/i);
    const firebaseUid: unknown = res.locals.user?.uid;

    // Only use the UID saved by the token verification middleware.
    if (
      !match ||
      typeof firebaseUid !== "string" ||
      firebaseUid.trim().length === 0
    ) {
      throw new TokenMissingOrInvalidError();
    }

    return { firebaseUid, token: match[1] };
  }

  private requiredString(data: Record<string, unknown>, field: string): string {
    const value = data[field];

    if (typeof value !== "string" || value.trim().length === 0) {
      throw new InvalidRequestError(`"${field}" must be a non-empty string.`);
    }

    return value.trim();
  }

  private optionalString(
    data: Record<string, unknown>,
    field: string,
  ): string | undefined {
    const value = data[field];

    // Optional database fields may be omitted or explicitly sent as null.
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== "string") {
      throw new InvalidRequestError(
        `"${field}" must be a string when provided.`,
      );
    }

    return value.trim();
  }

  private toAuthUserResponse(user: UserDTO) {
    const hiker = user.role === UserRole.HIKER ? user : undefined;

    // Preserve the authentication API's camelCase fields for all three roles.
    return {
      id: user.id,
      name: user.name,
      surname: hiker?.surname ?? null,
      email: user.email,
      mobileNumber: hiker?.mobile_number ?? null,
      notes: hiker?.notes ?? null,
      emergencyContact: hiker?.emergency_contact ?? null,
      role: user.role,
    };
  }
}
