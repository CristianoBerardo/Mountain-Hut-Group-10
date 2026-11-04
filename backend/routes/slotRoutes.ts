import { Router } from "express";
import {
  addTableToSlot,
  createMealSlot,
  deleteMealSlot,
  getMealSlotById,
  getMealSlotDetails,
  getMealSlots,
  removeTableFromSlot,
} from "../controllers/slotsController";
import { getAvailableSlot } from "../controllers/slotsTableController";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";
import { UserRole } from "../types/UserRole";

const router = Router();

router.get("/", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), getMealSlots);
router.get("/available", authenticateToken, authorizeRole(UserRole.HIKER, UserRole.EMPLOYEE, UserRole.WARDEN), getAvailableSlot);

router.get("/:id", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), getMealSlotById);
router.get("/:id/details", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), getMealSlotDetails);

// Used by the employee
router.post("/", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), createMealSlot);

router.post("/:id/tables", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), addTableToSlot);

router.delete("/:id", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), deleteMealSlot);
router.delete("/:id/tables/:tableId", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), removeTableFromSlot);

export default router;
