/**
 * This middleware must:
 *    1. Reat the JWT token from the request header
 *    2. Verify that the token is valid
 *    3. Extract the user if from the token
 *    4. Retrieve the user from the database using the extracted user id
 *    5. Saving the user object in the request object for further processing
 */

import { NextFunction, Request, Response } from "express";
import { adminAuth } from "../config/firebaseAdmin";

export async function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Retrieve the Authorization header from the request
        const authHeader = req.headers.authorization;

        // Check if the token is provided using the Bearer scheme
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Authorization header is missing or invalid" });
            return;
        }

        // Extract the token from the Authorization header
        const token = authHeader.split(" ")[1];

        // Verify JWT signature and expiration
        const decoded = await adminAuth.verifyIdToken(token);

        res.locals.user = decoded;

        // Continue to the next middleware or controller
        next();
    } catch (error) {
        console.error("Error authenticating token:", error);
        res.status(401).json({ error: "Invalid or expired token" });
    }
}