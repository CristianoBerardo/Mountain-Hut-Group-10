import { Router } from "express";
import {
  createReservationV2,
  deleteReservation,
  getReservationById,
  getReservations,
  updateReservation,
} from "../controllers/reservationController";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";
import { UserRole } from "../types/UserRole";

const router = Router();

router.get("/", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), getReservations);
router.get("/:id", authenticateToken, authorizeRole(UserRole.HIKER, UserRole.EMPLOYEE, UserRole.WARDEN), getReservationById);

router.post("/", authenticateToken, authorizeRole(UserRole.HIKER, UserRole.EMPLOYEE, UserRole.WARDEN), createReservationV2);

router.patch("/:id", authenticateToken, authorizeRole(UserRole.HIKER, UserRole.EMPLOYEE, UserRole.WARDEN), updateReservation);

router.delete("/:id", authenticateToken, authorizeRole(UserRole.HIKER,UserRole.EMPLOYEE, UserRole.WARDEN), deleteReservation);

export default router;
