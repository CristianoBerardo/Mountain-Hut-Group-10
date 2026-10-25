import { NextFunction, Request, Response } from "express";

type UserRole = "ADMIN" | "OPERATOR" | "TOTEM" | "GUEST";

/**
 * Middleware that restricts access to users with specific roles.
 *
 * Must be executed after authenticateToken, since it relies on
 * the authenticated user information stored in res.locals.user.
 *
 * @param allowedRoles - Roles allowed to access the endpoint.
 */
export function authorizeRole(...allowedRoles: UserRole[]) {

    return (
        req: Request,
        res: Response,
        next: NextFunction
    ): void => {

        // Retrieve the authenticated user
        const user = res.locals.user;

        // Check whether the user is authenticated
        if (!user) {
            res.status(401).json({
                error: "Authentication required"
            });
            return;
        }

        // Verify that the user has one of the required roles
        if (!allowedRoles.includes(user.role)) {
            res.status(403).json({
                error: "Access denied: insufficient permissions"
            });
            return;
        }

        // User is authorized: continue to the controller
        next();
    };
}