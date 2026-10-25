/**
 * This middleware must:
 *    1. Reat the JWT token from the request header
 *    2. Verify that the token is valid
 *    3. Extract the user if from the token
 *    4. Retrieve the user from the database using the extracted user id
 *    5. Saving the user object in the request object for further processing
 */

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../connections/PostgreSQL/database";

export async function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Retrieve the Authorization header from the request
    const authHeader = req.headers.authorization;

    // Check if the token is provided using the Bearer scheme
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authorization header is missing or invalid" });
        return;
    }

    // Extract the token from the Authorization header
    const token = authHeader.split(" ")[1];

    // Retrieve the JWT secret key from environment variables
    const secretKey = process.env.JWT_SECRET;

    // Check if the JWT secret key is defined
    if (!secretKey) {
        res.status(500).json({ error: "JWT secret key is not defined" });
        return;
    }

    try {
        // Verify JWT signature and expiration
        const decoded = jwt.verify(token, secretKey, {algorithms: ["HS256"]})

        //Validate the user ID stored in the JWT subject
        if (typeof decoded === "string" ||
            typeof decoded.sub !== "string" ||
            !decoded.sub) {
            res.status(401).json({ error: "Invalid token payload" });
            return;
        }

        // Retrieve the user ID from the decoded token
         const result = await pool.query(
            `SELECT id, username, role
             FROM "user"
             WHERE id = $1`,
            [decoded.sub]
         );
        
        const user = result.rows[0];

        // Reject tokens belonging to deleted users
        if (!user) {
            res.status(401).json({
                error: "User no longer exists"
            });
            return;
        }

        // Store authenticated user information for subsequent middleware
        res.locals.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        // Continue to the next middleware or controller
        next();
        
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                error: "Invalid or expired token"
            });
            return;
        }

        console.error("Authentication error:", error);

        res.status(500).json({
            error: "Internal server error"
        });
    }
}