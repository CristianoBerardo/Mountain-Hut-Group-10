import { Router } from "express";
import {
  createReservationV2,
  deleteReservation,
  getReservations,
} from "../controllers/reservationController";

const router = Router();

// In V2 they will be proteccted, for now they are public
// router.post("/", createReservation);
router.post("/", createReservationV2);

router.get("/", getReservations);
router.get("/:id", getReservations);

router.delete("/:id", deleteReservation);

export default router;
