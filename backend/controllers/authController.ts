import { Request, Response } from "express";
import { adminAuth } from "../config/firebaseAdmin";
import { pool } from "../connections/PostgreSQL/database";

export async function loginUser(
    req: Request,
    res: Response
): Promise<void> {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({ error: "Authorization header missing or invalid" });
            return;
        }
        
        const decodedToken = await adminAuth.verifyIdToken(authHeader?.split(" ")[1] || "");

        const decodedUID = decodedToken.uid;

        // Find the user in the database
        const result = await pool.query(
            `SELECT id, name, surname, email, mobile_number, notes, emergency_contact, role FROM "user" WHERE firebase_uid = $1`,
            [decodedUID]
        );
        console.log("User from database:", result.rows[0]);
        const user = result.rows[0];
    
        // If the user is not found, return a 404 error
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.status(200).json({
            message: "Login successful",
            token: authHeader,
            user: {
                id: user.id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                mobileNumber: user.mobile_number,
                notes: user.notes,
                emergencyContact: user.emergency_contact,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

