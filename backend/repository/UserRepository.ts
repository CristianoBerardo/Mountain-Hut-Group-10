import { pool } from "../connections/PostgreSQL/database";
import {
  AppError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from "../errors/AppError";
import { BaseUserDTO } from "../models/dto/BaseUserDTO";
import { HikerDTO } from "../models/dto/HikerDTO";
import { createHikerDTO, UserDTO } from "../types/UserDTOType";
import { UserRole } from "../types/UserRole";

interface UserRow extends BaseUserDTO {
  role: string;
  surname: string | null;
  mobile_number: string | null;
  notes: string | null;
  emergency_contact: string | null;
}

export class UserRepository {
  constructor() {}

  private toUserDTO(row: UserRow): UserDTO {
    const base: BaseUserDTO = {
      id: row.id,
      firebase_uid: row.firebase_uid,
      name: row.name,
      email: row.email,
    };

    switch (row.role) {
      case UserRole.HIKER:
        if (
          typeof row.surname !== "string" ||
          typeof row.mobile_number !== "string"
        ) {
          throw new InternalServerError("Missing required hiker fields");
        }

        return {
          ...base,
          role: UserRole.HIKER,
          surname: row.surname,
          mobile_number: row.mobile_number,
          notes: row.notes ?? undefined,
          emergency_contact: row.emergency_contact ?? undefined,
        };
      case UserRole.EMPLOYEE:
        return { ...base, role: UserRole.EMPLOYEE };
      case UserRole.WARDEN:
        return { ...base, role: UserRole.WARDEN };
      default:
        throw new InternalServerError("Role not found");
    }
  }

  public async getUsers(): Promise<UserDTO[]> {
    try {
      const result = await pool.query<UserRow>(`SELECT * FROM "user"`);

      if (result.rows.length === 0) {
        throw new NotFoundError("No users found");
      }

      return result.rows.map((row) => this.toUserDTO(row));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      console.error("Error retrieving users:", error);
      throw new InternalServerError();
    }
  }

  public async createHiker({
    user,
  }: {
    user: createHikerDTO;
  }): Promise<HikerDTO> {
    try {
      const result = await pool.query<UserRow>(
        `INSERT INTO "user" (
                firebase_uid,
                name,
                surname,
                email,
                mobile_number,
                notes,
                emergency_contact,
                role
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING
                id,
                firebase_uid,
                name,
                surname,
                email,
                mobile_number,
                notes,
                emergency_contact,
                role`,
        [
          user.firebase_uid,
          user.name,
          user.surname,
          user.email,
          user.mobile_number,
          user.notes ?? null,
          user.emergency_contact ?? null,
          UserRole.HIKER,
        ],
      );

      const row = result.rows[0];
      if (!row) {
        throw new InternalServerError("Created hiker was not returned");
      }

      const hiker = this.toUserDTO(row);
      if (hiker.role !== UserRole.HIKER) {
        throw new InternalServerError("Created user is not a hiker");
      }

      return hiker;
    } catch (error) {
      // Preserve application errors raised while mapping the created profile.
      if (error instanceof AppError) {
        throw error;
      }

      // PostgreSQL enforces unique Firebase UIDs and email addresses atomically.
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new ConflictError(
          "A user with this Firebase UID or email address already exists.",
        );
      }

      console.error("Error creating user:", error);
      throw new InternalServerError("Unable to create the hiker account.");
    }
  }

  public async getUserByFirebaseUid({
    firebase_uid,
  }: {
    firebase_uid: string;
  }): Promise<UserDTO> {
    try {
      const result = await pool.query<UserRow>(
        `SELECT * FROM "user" WHERE firebase_uid = $1`,
        [firebase_uid],
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(
          "Not user found with the provided firebase_uid",
        );
      }

      if (result.rows.length > 1) {
        throw new InternalServerError(
          "Multiple users found with the same firebase_uid",
        );
      }

      return this.toUserDTO(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      console.error("Error retrieving user:", error);
      throw new InternalServerError("Error retrieving user");
    }
  }
}
