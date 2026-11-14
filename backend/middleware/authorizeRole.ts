import { NextFunction, Request, Response } from "express";

import {
  InsufficientPermissionsError,
  TokenMissingOrInvalidError,
} from "../errors/AppError";
import { UserRole } from "../types/UserRole";

/**
 * Middleware that restricts access to users with specific roles.
 *
 * Must be executed after authenticateToken, since it relies on
 * the authenticated user information stored in res.locals.user.
 *
 * @param allowedRoles - Roles allowed to access the endpoint.
 */
export function authorizeRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Retrieve the authenticated user
      const role = res.locals.user?.role as UserRole;

      // Check whether the user is authenticated
      if (!role) {
        throw new TokenMissingOrInvalidError();
      }

      // Verify that the user has one of the required roles
      if (!allowedRoles.includes(role as UserRole)) {
        throw new InsufficientPermissionsError();
      }

      // User is authorized: continue to the controller
      next();
    } catch (error) {
      next(error);
    }
  };
}
