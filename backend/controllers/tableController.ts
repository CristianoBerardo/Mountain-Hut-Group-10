import { Request, Response } from "express";
import { pool } from "../connections/PostgreSQL/database";
import { DiningTable } from "../models/DiningTable";

// GET + filters ?active=true&available=true
export async function getTables(req: Request, res: Response) {
  try {
    const { active, available } = req.query;
    let query = `SELECT * FROM dining_table WHERE 1=1`;
    const params: any[] = [];

    if (active !== undefined) {
      params.push(active === "true");
      query += ` AND is_active = $${params.length}`;
    }

    if (available === "true") {
      query += ` AND occupancy < capacity`;
    }

    query += ` ORDER BY table_number ASC`;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving tables:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTableById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM dining_table WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error retrieving table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function checkTableExists(table_number: Number): Promise<boolean> {
  const result = await pool.query(
    `SELECT * FROM dining_table WHERE table_number = $1`,
    [table_number],
  );
  return result.rows.length > 0;
}

export async function getTableByTableNumber(req: Request, res: Response) {
  try {
    const { table_number } = req.params;

    console.log("Received request for table with number:", req.params);

    const result = await pool.query(
      `SELECT * FROM dining_table WHERE table_number = $1`,
      [table_number],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error retrieving table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ! Attention needed, does it make sense to have UUID ad a PK and table_number as a unique field?
export async function createTable(req: Request, res: Response) {
  try {
    const table: Omit<DiningTable, "id"> = {
      ...req.body,
      table_number: req.body.table_number ?? req.body.tableNumber,
      capacity: req.body.capacity,
      occupancy: req.body.occupancy ?? 0,
      is_active: req.body.is_active ?? req.body.isActive ?? true,
    };

    if (!table.table_number || !table.capacity) {
      res.status(400).json({ error: "table_number and capacity are required" });
      return;
    }

    if (table.occupancy > table.capacity) {
      res
        .status(400)
        .json({ error: "occupancy cannot be greater than capacity" });
      return;
    }

    if (await checkTableExists(table.table_number)) {
      res.status(409).json({ error: "Table number already exists" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO dining_table (table_number, capacity, occupancy, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [table.table_number, table.capacity, table.occupancy, table.is_active],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateTable(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const table: Omit<DiningTable, "id"> = {
      ...req.body,
      table_number: req.body.table_number ?? req.body.tableNumber,
      capacity: req.body.capacity,
      occupancy: req.body.occupancy ?? 0,
      is_active: req.body.is_active ?? req.body.isActive ?? true,
    };

    if (!table.table_number || !table.capacity) {
      res.status(400).json({ error: "table_number and capacity are required" });
      return;
    }

    if (table.occupancy > table.capacity) {
      res
        .status(400)
        .json({ error: "occupancy cannot be greater than capacity" });
      return;
    }

    if (table.table_number && (await checkTableExists(table.table_number))) {
      res.status(409).json({ error: "Table number already exists" });
      return;
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
      res.status(404).json({ error: "Table not found" });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function resetTableOccupancy(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE dining_table SET occupancy = 0 WHERE id = $1 RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error resetting table occupancy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteTable(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM dining_table WHERE id = $1 RETURNING *`,
      [id],
    );

    // Delete all table for dev purposes
    // const result = await pool.query(`DELETE FROM dining_table RETURNING *`);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Table not found" });
      return;
    }

    res.status(200).json({ message: "Table deleted successfully" });
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
