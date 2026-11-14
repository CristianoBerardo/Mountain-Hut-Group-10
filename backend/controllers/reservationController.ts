import { NextFunction, Request, Response } from "express";
import { ReservationRepository } from "../repository/ReservationRepository";
import {
  positiveInteger,
  requestObject,
  requiredString,
} from "../utils/requestValidation";

export class ReservationController {
  private readonly reservationRepository: ReservationRepository;

  constructor() {
    this.reservationRepository = new ReservationRepository();
  }

  /** Validate the HTTP request and delegate to the repository. */
  async getReservations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await this.reservationRepository.getReservations();
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async getReservationById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const result = await this.reservationRepository.getReservationById(id);
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async createReservationV2(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const body = requestObject(req.body);
      const input = {
        hiker_id: requiredString(body.hiker_id, "hiker_id"),
        slot_id: requiredString(body.slot_id, "slot_id"),
        party_size: positiveInteger(body.party_size, "party_size"),
      };
      const result = await this.reservationRepository.createReservation(input);
      res.status(201).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async updateReservation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const body = requestObject(req.body);
      const partySize = positiveInteger(body.party_size, "party_size");
      const result = await this.reservationRepository.updateReservation(
        id,
        partySize,
      );
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }

  /** Validate the HTTP request and delegate to the repository. */
  async deleteReservation(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = requiredString(req.params.id, "id");
      const result = await this.reservationRepository.deleteReservation(id);
      res.status(200).json(result);
    } catch (error) {
      // Preserve typed errors for the shared HTTP error handler.
      next(error);
    }
  }
}
