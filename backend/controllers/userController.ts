import { Request, Response } from "express";
import { pool } from "../connections/PostgreSQL/database";
import { CreateUserDTO, UpdateUserDTO } from "../models/dto/UserDTO";

/**
 * Creates a new user in the database based on the provided user data.
 * @param req - The Express request object containing the user data in the request body.
 * @param res - The Express response object used to send the response.
 * @returns A Promise that resolves when the operation is complete.
 * @throws An error if there is an issue with the database operation.
*/

export async function createUser(req: Request, res: Response): Promise<void> {
    try {
        const user_data: CreateUserDTO = req.body;

        console.log("BODY RICEVUTO:", req.body);

        console.log("Username:", user_data?.username);
        console.log("Username type:", typeof user_data?.username);
        console.log("Password type:", typeof user_data?.password);
        console.log("Body keys:", Object.keys(req.body ?? {}));

        if (
            typeof user_data.username !== "string" ||
            user_data.username.trim().length === 0 || typeof user_data.password !== "string" ||
            user_data.password.trim().length === 0
        ) {
            res.status(400).json({ error: "Username and password are required" });
            return;
        }

        if (await usernameExists(user_data.username.trim())) {
            res.status(409).json({ error: "Username already exists" });
            return;
        }
        else {
            const result = await pool.query(
                `INSERT INTO "user" (username, password, role)
                VALUES ($1, $2, $3)
                RETURNING id, username, role`
            , [user_data.username.trim(), user_data.password.trim(), user_data.role || "GUEST"]);

            res.status(201).json(result.rows[0]);
        }


    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

/**
 * Retrieves a user from the database based on the provided username.
 * @param req - The Express request object containing the username parameter.
 * @param res - The Express response object used to send the response.
 * @returns A Promise that resolves when the operation is complete.
 * @throws An error if there is an issue with the database operation.
 */

export async function getUserByUsername(req: Request, res: Response): Promise<void> {
    try {
        const { username } = req.params;

        if (
            typeof username !== "string" ||
            username.trim().length === 0
        ) {
            res.status(400).json({ error: "Username is required" });
            return;
        }

        const result = await pool.query(
            `SELECT id, username, role FROM "user" WHERE username = $1`,
            [username.trim()]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error retrieving user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

/**
 * Updates a user in the database based on the provided username.
 * @param req - The Express request object containing the username parameter and updated user data.
 * @param res - The Express response object used to send the response.
 * @returns A Promise that resolves when the operation is complete.
 * @throws An error if there is an issue with the database operation.
 */

export async function updateUser(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const { username } = req.params;
        const user_data: UpdateUserDTO = req.body;

        // Validate the username parameter
        if (
            typeof username !== "string" ||
            username.trim().length === 0
        ) {
            res.status(400).json({
                error: "Username is required"
            });
            return;
        }

        // Validate the request body
        if (
            !user_data ||
            typeof user_data !== "object" ||
            Array.isArray(user_data) ||
            Object.keys(user_data).length === 0
        ) {
            res.status(400).json({
                error: "Request body must be a non-empty object"
            });
            return;
        }

        // Validate provided fields in the request body
        const { username: newUsername, password: newPassword, role: newRole } = user_data;

        if (newUsername !== undefined && (typeof newUsername !== "string" || newUsername.trim().length === 0) ||
            newPassword !== undefined && (typeof newPassword !== "string" || newPassword.trim().length === 0) ||
            newRole !== undefined && (typeof newRole !== "string" || newRole.trim().length === 0)) {
            res.status(400).json({
                error: "Invalid fields in request body. Username, password, and role must be non-empty strings if provided."
            });
            return;
        }

        // Check if the username exists in the database
        if (!await usernameExists(username.trim())) {
            res.status(409).json({
                error: "Username does not exist"
            });
            return;
        }

        // Check if the new username already exists in the database (if provided)
        if (newUsername !== undefined && newUsername !== username &&  await usernameExists(newUsername.trim())) {
            res.status(409).json({
                error: `Username ${newUsername} already exists`
            });
            return;
        }

        // Update the user in the database
        const result = await pool.query(
            `UPDATE "user"
             SET username = COALESCE($1, username), password = COALESCE($2, password), role = COALESCE($3, role)
             WHERE username = $4
             RETURNING id, username, role`,
            [newUsername?.trim() ?? null, newPassword?.trim() ?? null, newRole?.trim() ?? null, username.trim()]
        );

        // Check update result and respond accordingly
        if (result.rows.length === 0) {
            res.status(404).json({
                error: "User not found"
            });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error updating user:", error);

        res.status(500).json({
            error: "Internal server error"
        });
    }
}

/**
 * Deletes a user from the database based on the provided username.
 * @param req - The Express request object containing the username parameter.
 * @param res - The Express response object used to send the response.
 * @returns A Promise that resolves when the operation is complete.
 * @throws An error if there is an issue with the database operation.
 */

export async function deleteUser(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const { username } = req.params;

        if (
            typeof username !== "string" ||
            username.trim().length === 0
        ) {
            res.status(400).json({
                error: "Username is required"
            });
            return;
        }

        const result = await pool.query(
            `DELETE FROM "user" WHERE username = $1 RETURNING id, username, role`,
            [username.trim()]
        );

        if (result.rows.length === 0) {
            res.status(404).json({
                error: "User not found"
            });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            error: "Internal server error"
        });
    }
}

/**
 * Checks if a username already exists in the database.
 * @param username 
 * @returns 
 */
async function usernameExists(username: string): Promise<boolean> {
    const result = await pool.query(
        `SELECT 1 FROM "user" WHERE username = $1 LIMIT 1`,
        [username]
    );

    return (result.rowCount ?? 0) > 0;
}