import { NextFunction, Request, Response } from "express";
import { SlotsTableRepository } from "../repository/SlotsTableRepository";

export class SlotsTableController {
  private readonly slotsTableRepository: SlotsTableRepository;

  constructor() {
    this.slotsTableRepository = new SlotsTableRepository();
  }

  /** Placeholder until the availability-checking endpoint is implemented. */
  async checkAvailability(
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    res.status(501).json({ error: "Availability checking is not implemented yet" });
  }

  /** Handle GET /api/v1/slots/available without accessing the database directly. */
  async getAvailableSlot(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const slots = await this.slotsTableRepository.getAvailableSlot();
      res.status(200).json(slots);
    } catch (error) {
      // Let the shared error handler translate application errors into HTTP responses.
      next(error);
    }
  }
}
