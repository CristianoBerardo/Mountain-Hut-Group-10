import { NextFunction, Request, Response } from "express";
import { SlotsRepository } from "../repository/SlotsRepository";
import { requestObject, requiredString } from "../utils/requestValidation";

export class SlotsController {
  private readonly slotsRepository: SlotsRepository;

  constructor() {
    this.slotsRepository = new SlotsRepository();
  }

  /** Validate the HTTP request and delegate to the repository. */
  async getMealSlots(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.slotsRepository.getMealSlots();
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async getMealSlotById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const result = await this.slotsRepository.getMealSlotById(id);
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async getMealSlotDetails(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const result = await this.slotsRepository.getMealSlotDetails(id);
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async createMealSlot(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const body = requestObject(req.body);
      const mealSlot = {
        date: requiredString(body.date, "date"),
        starts_at: requiredString(body.starts_at, "starts_at"),
        ends_at: requiredString(body.ends_at, "ends_at"),
      };
      const result = await this.slotsRepository.createMealSlot(mealSlot);
      res.status(201).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async deleteMealSlot(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const result = await this.slotsRepository.deleteMealSlot(id);
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async addTableToSlot(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const body = requestObject(req.body);
      const tableId = requiredString(body.dining_table_id, "dining_table_id");
      const result = await this.slotsRepository.addTableToSlot(id, tableId);
      res.status(201).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async removeTableFromSlot(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const tableId = requiredString(req.params.tableId, "tableId");
      const result = await this.slotsRepository.removeTableFromSlot(
        id,
        tableId,
      );
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }
}
