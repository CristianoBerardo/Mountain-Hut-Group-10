import { NextFunction, Request, Response } from "express";
import { TableRepository } from "../repository/TableRepository";
import {
  booleanQuery,
  booleanValue,
  nonNegativeInteger,
  positiveInteger,
  requestObject,
  requiredString,
} from "../utils/requestValidation";
import { DiningTableDTO } from "../models/dto/DiningTableDTO";

export class TableController {
  private readonly tableRepository: TableRepository;

  constructor() {
    this.tableRepository = new TableRepository();
  }

  /** Validate the HTTP request and delegate to the repository. */
  async getTables(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const active = booleanQuery(req.query.active, "active");
      const available = booleanQuery(req.query.available, "available");
      const result = await this.tableRepository.getTables({
        active,
        available,
      });
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async getTableById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const result = await this.tableRepository.getTableById(id);
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async getTableByTableNumber(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const tableNumber = positiveInteger(
        Number(req.params.table_number),
        "table_number",
      );
      const result =
        await this.tableRepository.getTableByTableNumber(tableNumber);
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async createTable(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const table = this.tableInput(req.body);
      const result = await this.tableRepository.createTable(table);
      res.status(201).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async updateTable(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const table = this.tableInput(req.body);
      const result = await this.tableRepository.updateTable(id, table);
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async resetTableOccupancy(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const result = await this.tableRepository.resetTableOccupancy(id);
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async deleteTable(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const result = await this.tableRepository.deleteTable(id);
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  // Keep support for both snake_case and camelCase request fields.
  private tableInput(value: unknown): Omit<DiningTableDTO, "id"> {
    const body = requestObject(value);
    return {
      table_number: positiveInteger(
        body.table_number ?? body.tableNumber,
        "table_number",
      ),
      capacity: positiveInteger(body.capacity, "capacity"),
      occupancy: nonNegativeInteger(body.occupancy ?? 0, "occupancy"),
      is_active: booleanValue(
        body.is_active ?? body.isActive ?? true,
        "is_active",
      ),
    };
  }
}
