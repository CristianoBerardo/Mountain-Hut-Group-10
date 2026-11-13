import { Router } from "express";
import { ReservationController } from "../controllers/reservationController";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";
import { UserRole } from "../types/UserRole";

const router = Router();
const reservationController = new ReservationController();

router.get(
  "/",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  reservationController.getReservations.bind(reservationController),
);
router.get(
  "/:id",
  authenticateToken,
  authorizeRole(UserRole.HIKER, UserRole.EMPLOYEE, UserRole.WARDEN),
  reservationController.getReservationById.bind(reservationController),
);

router.post(
  "/",
  authenticateToken,
  authorizeRole(UserRole.HIKER, UserRole.EMPLOYEE, UserRole.WARDEN),
  reservationController.createReservationV2.bind(reservationController),
);

router.patch(
  "/:id",
  authenticateToken,
  authorizeRole(UserRole.HIKER, UserRole.EMPLOYEE, UserRole.WARDEN),
  reservationController.updateReservation.bind(reservationController),
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(UserRole.HIKER, UserRole.EMPLOYEE, UserRole.WARDEN),
  reservationController.deleteReservation.bind(reservationController),
);

export default router;
