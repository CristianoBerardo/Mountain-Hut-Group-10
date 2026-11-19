import { NextFunction, Request, Response } from "express";
import { HikerDTO } from "../models/dto/HikerDTO";
import { ReservationRepository } from "../repository/ReservationRepository";
import { UserRepository } from "../repository/UserRepository";
import { sendReservationConfirmation } from "../services/emailService";
import { UserRole } from "../types/UserRole";
import {
  positiveInteger,
  requestObject,
  requiredString,
} from "../utils/requestValidation";

export class ReservationController {
  private readonly reservationRepository: ReservationRepository;
  private readonly userRepository: UserRepository;

  constructor() {
    this.reservationRepository = new ReservationRepository();
    this.userRepository = new UserRepository();
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


      try {
        const hiker = await this.userRepository.getUserById({ id: input.hiker_id });
        const hikerSurname = hiker.role === UserRole.HIKER ? (hiker as HikerDTO).surname : null;
        await sendReservationConfirmation(hiker.email, {
          hikerName: hiker.name,
          hikerSurname,
          reservationId: result.reservation.id,
          date: result.reservation.starts_at.slice(0, 10),
          startsAt: new Date(result.reservation.starts_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }),
          endsAt: new Date(result.reservation.ends_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }),
          partySize: result.reservation.party_size,
          tables: result.tables.map(t => ({
            tableNumber: t.table_number,
            seatsAssigned: t.seats_assigned,
          })),
        });
      } catch (emailError) {
        console.error("Reservation created, but failed to send email:", emailError);
      }
      res.status(201).json(result);
    } catch (error) {
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
