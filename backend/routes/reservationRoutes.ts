import { Router } from "express";
import {
  createReservationV2,
  deleteReservation,
  getReservationById,
  getReservations,
  updateReservation,
} from "../controllers/reservationController";

const router = Router();

router.get("/", getReservations);
router.get("/:id", getReservationById);

router.post("/", createReservationV2);

router.patch("/:id", updateReservation);

router.delete("/:id", deleteReservation);

export default router;
