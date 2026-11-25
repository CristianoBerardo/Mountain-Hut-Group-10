import { NextFunction, Request, Response } from "express";
import {
  InsufficientCapacityError,
  InvalidRequestError,
} from "../errors/AppError";
import { CheckAvailabilityResponseDTO } from "../models/dto/CheckAvailabilityDTO";
import { SlotsTableRepository } from "../repository/SlotsTableRepository";
import { TableAvailability } from "../types/reservationTypes";
import { assignTablesToParty } from "../utils/tableAssignment";
import { requiredString } from "../utils/requestValidation";

function assignTablesOrEmpty(
  partySize: number,
  tables: TableAvailability[],
): ReturnType<typeof assignTablesToParty> {
  try {
    return assignTablesToParty(partySize, tables);
  } catch (error) {
    if (error instanceof InsufficientCapacityError) {
      return [];
    }
    throw error;
  }
}

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
      const assignments: ReturnType<typeof assignTablesToParty> =
        availability.meal_slot_id === null
          ? []
          : assignTablesOrEmpty(partySize, availability.tables);

      const response: CheckAvailabilityResponseDTO = {
        meal_slot_id: availability.meal_slot_id,
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
