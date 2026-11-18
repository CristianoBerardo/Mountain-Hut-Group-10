import { NextFunction, Request, Response } from "express";
import { InvalidRequestError } from "../errors/AppError";
import { CheckAvailabilityResponseDTO } from "../models/dto/CheckAvailabilityDTO";
import { SlotsTableRepository } from "../repository/SlotsTableRepository";
import { assignTablesToParty } from "../utils/tableAssignment";
import { requiredString } from "../utils/requestValidation";

export class SlotsTableController {
  private readonly slotsTableRepository: SlotsTableRepository;

  constructor() {
    this.slotsTableRepository = new SlotsTableRepository();
  }

  /** Check whether a party can be seated in a meal slot. */
  async checkAvailability(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const date = requiredString(req.query.date, "date");
      const dateValue = new Date(`${date}T00:00:00.000Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(dateValue.getTime()) ||
        dateValue.toISOString().slice(0, 10) !== date
      ) {
        throw new InvalidRequestError(
          "date must be a valid date in YYYY-MM-DD format",
        );
      }

      const time = requiredString(req.query.time, "time");
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        throw new InvalidRequestError("time must be in HH:mm format");
      }

      const partySizeValue = requiredString(req.query.party_size, "party_size");
      const partySize = Number(partySizeValue);
      if (
        !/^\d+$/.test(partySizeValue) ||
        !Number.isSafeInteger(partySize) ||
        partySize <= 0
      ) {
        throw new InvalidRequestError("party_size must be a positive integer");
      }

      const availability = await this.slotsTableRepository.getSlotAvailability(
        date,
        time,
      );
      const availableSeats =
        availability.tables.reduce((total, table) => total + table.freeSeats, 0);
      let assignments: ReturnType<typeof assignTablesToParty> = [];

      if (availability.slot_id !== null) {
        try {
          assignments = assignTablesToParty(partySize, availability.tables);
        } catch (error) {
          if (
            !(error instanceof Error) ||
            error.message !== "INSUFFICIENT_CAPACITY"
          ) {
            throw error;
          }
        }
      }

      const response: CheckAvailabilityResponseDTO = {
        slot_id: availability.slot_id,
        available_times: availability.available_times,
        date,
        time,
        party_size: partySize,
        available: assignments.length > 0,
        available_seats: availableSeats,
        tables: assignments
          .map(({ tableId, tableNumber, seatsAssigned }) => ({
            table_id: tableId,
            table_number: tableNumber,
            seats_assigned: seatsAssigned,
          }))
          .sort((a, b) => a.table_number - b.table_number),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
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
