import { Request, Response } from "express";
import { adminAuth } from "../config/firebaseAdmin";
import { pool } from "../connections/PostgreSQL/database";
import { UserRepository } from "../repository/UserRepository";
import { createHikerDTO } from "../types/UserDTOType";
import { UserRole } from "../types/UserRole";
import { HikerDTO } from "../models/dto/HikerDTO";

export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ error: "Authorization header missing or invalid" });
      return;
    }

    const decodedToken = await adminAuth.verifyIdToken(
      authHeader?.split(" ")[1] || "",
    );

    const decodedUID = decodedToken.uid;

    // Find the user in the database
    const result = await pool.query(
      `SELECT id, name, surname, email, mobile_number, notes, emergency_contact, role FROM "user" WHERE firebase_uid = $1`,
      [decodedUID],
    );
    console.log("User from database:", result.rows[0]);
    const user = result.rows[0];

    // If the user is not found, return a 404 error
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Add custom claims
    const tokenWithRole = await adminAuth.setCustomUserClaims(
      decodedToken.uid,
      {
        role: user.role as UserRole,
      },
    );

    res.status(200).json({
      message: "Login successful",
      token: tokenWithRole,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        mobileNumber: user.mobile_number,
        notes: user.notes,
        emergencyContact: user.emergency_contact,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    const userRepository = new UserRepository();

    if (!authHeader?.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ error: "Authorization header missing or invalid" });
      return;
    }

    const decodedToken = await adminAuth.verifyIdToken(
      authHeader?.split(" ")[1] || "",
    );

    const decodedUID = decodedToken.uid;

    // Validate required fields
    if (
      !req.body.name ||
      !req.body.surname ||
      !req.body.email ||
      !req.body.mobile_number
    ) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const newUser: createHikerDTO = {
      firebase_uid: decodedUID,
      name: req.body.name,
      surname: req.body.surname ?? null,
      email: req.body.email,
      mobile_number: req.body.mobile_number ?? null,
      notes: req.body.notes ?? null,
      emergency_contact: req.body.emergency_contact ?? null,
      role: UserRole.HIKER,
    };

    // Insert user into PostgreSQL
    const result = await userRepository.createHiker({
      user: newUser,
    });

    console.log("User from database:", result);
    const user: HikerDTO = result;

    // If the user is not found, return a 404 error
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Login successful",
      token: authHeader.split(" ")[1],
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        mobileNumber: user.mobile_number,
        notes: user.notes,
        emergencyContact: user.emergency_contact,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
