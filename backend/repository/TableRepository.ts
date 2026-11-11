import { pool } from "../connections/PostgreSQL/database";
import {
  ConflictError,
  InvalidRequestError,
  NotFoundError,
} from "../errors/AppError";
import { DiningTableDTO } from "../models/dto/DiningTableDTO";
import { throwRepositoryError } from "./utils/repositoryErrors";

export class TableRepository {
  /** List dining tables using optional active and availability filters. */
  public async getTables({
    active,
    available,
  }: { active?: boolean; available?: boolean } = {}): Promise<
    DiningTableDTO[]
  > {
    try {
      let query = `SELECT * FROM dining_table WHERE 1=1`;
      const params: boolean[] = [];
      if (active !== undefined) {
        params.push(active);
        query += ` AND is_active = $${params.length}`;
      }
      if (available === true) {
        query += ` AND occupancy < capacity`;
      }
      query += ` ORDER BY table_number ASC`;
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to retrieve dining tables.",
        "Table number already exists",
      );
    }
  }
  /** Retrieve a dining table by its database ID. */
  public async getTableById(id: string): Promise<DiningTableDTO> {
    try {
      const result = await pool.query(
        `SELECT * FROM dining_table WHERE id = $1`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundError("Table not found");
      }
      return result.rows[0];
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to retrieve the dining table.",
        "Table number already exists",
      );
    }
  }
  /** Retrieve a dining table by its displayed table number. */
  public async getTableByTableNumber(
    table_number: number,
  ): Promise<DiningTableDTO> {
    try {
      const result = await pool.query(
        `SELECT * FROM dining_table WHERE table_number = $1`,
        [table_number],
      );
      if (result.rows.length === 0) {
        throw new NotFoundError("Table not found");
      }
      return result.rows[0];
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to retrieve the dining table.",
        "Table number already exists",
      );
    }
  }
  /** Create a dining table after checking its number and capacity. */
  public async createTable(
    table: Omit<DiningTableDTO, "id">,
  ): Promise<DiningTableDTO> {
    try {
      if (!table.table_number || !table.capacity) {
        throw new InvalidRequestError("table_number and capacity are required");
      }
      if (table.occupancy > table.capacity) {
        throw new InvalidRequestError(
          "occupancy cannot be greater than capacity",
        );
      }
      if (await this.checkTableExists(table.table_number)) {
        throw new ConflictError("Table number already exists");
      }
      const result = await pool.query(
        `INSERT INTO dining_table (table_number, capacity, occupancy, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
        [table.table_number, table.capacity, table.occupancy, table.is_active],
      );
      return result.rows[0];
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to create the dining table.",
        "Table number already exists",
      );
    }
  }
  /** Update a dining table while preserving unique table numbers. */
  public async updateTable(
    id: string,
    table: Omit<DiningTableDTO, "id">,
  ): Promise<DiningTableDTO> {
    try {
      if (!table.table_number || !table.capacity) {
        throw new InvalidRequestError("table_number and capacity are required");
      }
      if (table.occupancy > table.capacity) {
        throw new InvalidRequestError(
          "occupancy cannot be greater than capacity",
        );
      }
      if (
        table.table_number &&
        (await this.checkTableExists(table.table_number, id))
      ) {
        throw new ConflictError("Table number already exists");
      }
      const result = await pool.query(
        `UPDATE dining_table SET 
        table_number = COALESCE($1, table_number),
        capacity = COALESCE($2, capacity),
        occupancy = COALESCE($3, occupancy),
        is_active = COALESCE($4, is_active)
       WHERE id = $5 RETURNING *`,
        [
          table.table_number,
          table.capacity,
          table.occupancy,
          table.is_active,
          id,
        ],
      );
      if (result.rows.length === 0) {
        throw new NotFoundError("Table not found");
      }
      return result.rows[0];
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to update the dining table.",
        "Table number already exists",
      );
    }
  }
  /** Reset the current occupancy of an existing dining table. */
  public async resetTableOccupancy(id: string): Promise<DiningTableDTO> {
    try {
      const result = await pool.query(
        `UPDATE dining_table SET occupancy = 0 WHERE id = $1 RETURNING *`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundError("Table not found");
      }
      return result.rows[0];
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to reset table occupancy.",
        "Table number already exists",
      );
    }
  }
  /** Delete an existing dining table. */
  public async deleteTable(id: string): Promise<{ message: string }> {
    try {
      const result = await pool.query(
        `DELETE FROM dining_table WHERE id = $1 RETURNING *`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundError("Table not found");
      }
      return { message: "Table deleted successfully" };
    } catch (error) {
      return throwRepositoryError(
        error,
        "Unable to delete the dining table.",
        "Table number already exists",
      );
    }
  }
  // Exclude the current record when checking an updated table number.
  private async checkTableExists(
    table_number: number,
    excludeId?: string,
  ): Promise<boolean> {
    const result = await pool.query(
      `SELECT * FROM dining_table WHERE table_number = $1 AND id IS DISTINCT FROM $2`,
      [table_number, excludeId ?? null],
    );
    return result.rows.length > 0;
  }
}
