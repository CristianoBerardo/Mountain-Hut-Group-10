import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../connections/PostgreSQL/database";
import { LoginDTO } from "../models/dto/AuthDTO";

export async function loginUser(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const user_data: LoginDTO = req.body;

        // Validate the request body
        if (
            typeof user_data.username !== "string" ||
            user_data.username.trim().length === 0 || typeof user_data.password !== "string" ||
            user_data.password.trim().length === 0
        ) {
            res.status(400).json({ error: "Username and password are required" });
            return;
        }

        // Find the user in the database
        const result = await pool.query(
            `SELECT id, username, password, role FROM "user" WHERE username = $1`,
            [user_data.username.trim()]
        );
        const user = result.rows[0];
    
        // If the user is not found, return a 404 error
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        // Compare passwords (testing only)
        if (user.password !== user_data.password) {
            res.status(401).json({
                error: "Invalid credentials"
            });
            return;
        }

        // Generate a JWT token (for demonstration purposes, using a simple string)
        const secretKey = process.env.JWT_SECRET;

        if (!secretKey) {
            res.status(500).json({ error: "JWT secret key is not defined" });
            return;
        }

        const token = jwt.sign({
            role: user.role,
        }, secretKey,
            {
                subject: String(user.id),
                expiresIn: "1h",
                algorithm: "HS256"
            }
        );
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

