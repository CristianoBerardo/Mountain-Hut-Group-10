import { pool } from "../connections/PostgreSQL/database";
import { InternalServerError, NotFoundError } from "../errors/AppError";
import { BaseUserDTO } from "../models/dto/BaseUserDTO";
import { HikerDTO } from "../models/dto/HikerDTO";
import { createHikerDTO, UserDTO } from "../types/UserDTOType";
import { UserRole } from "../types/UserRole";
import { requiredString } from "../utils/requestValidation";
import { throwRepositoryError } from "./utils/repositoryErrors";

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
        // Invalid stored data is a server error, not a request validation error.
        if (
          typeof row.surname !== "string" ||
          typeof row.mobile_number !== "string"
        ) {
          throw new InternalServerError(
            "The stored hiker profile is missing required fields.",
          );
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
        throw new InternalServerError(
          "The stored user has an unsupported role.",
        );
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
      return throwRepositoryError(error, "Unable to retrieve users.");
    }
  }

  public async createHiker({
    user,
  }: {
    user: createHikerDTO;
  }): Promise<HikerDTO> {
    try {
      // Validate required input fields before executing the insert.
      const firebaseUid = requiredString(user.firebase_uid, "firebase_uid");
      const name = requiredString(user.name, "name");
      const surname = requiredString(user.surname, "surname");
      const email = requiredString(user.email, "email");
      const mobileNumber = requiredString(user.mobile_number, "mobile_number");

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
          firebaseUid,
          name,
          surname,
          email,
          mobileNumber,
          user.notes ?? null,
          user.emergency_contact ?? null,
          UserRole.HIKER,
        ],
      );

      const row = result.rows[0];
      if (!row) {
        throw new InternalServerError(
          "The database did not return the created hiker.",
        );
      }

      const hiker = this.toUserDTO(row);
      if (hiker.role !== UserRole.HIKER) {
        throw new InternalServerError(
          "The created user does not have the HIKER role.",
        );
      }

      return hiker;
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to create the hiker account.",
        "A user with this Firebase UID or email address already exists.",
      );
    }
  }

  public async getUserByFirebaseUid({
    firebase_uid,
  }: {
    firebase_uid: string;
  }): Promise<UserDTO> {
    try {
      // Reject missing or blank UIDs before accessing PostgreSQL.
      const firebaseUid = requiredString(firebase_uid, "firebase_uid");
      const result = await pool.query<UserRow>(
        `SELECT * FROM "user" WHERE firebase_uid = $1`,
        [firebaseUid],
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(
          "No user was found with the provided Firebase UID.",
        );
      }

      if (result.rows.length > 1) {
        throw new InternalServerError(
          "Multiple users share the same Firebase UID.",
        );
      }

      return this.toUserDTO(result.rows[0]);
    } catch (error) {
      return throwRepositoryError(error, "Unable to retrieve the user.");
    }
  }
}
