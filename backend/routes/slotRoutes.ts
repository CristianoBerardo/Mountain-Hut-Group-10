import { Router } from "express";
import { SlotsController } from "../controllers/slotsController";
import { SlotsTableController } from "../controllers/slotsTableController";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";
import { UserRole } from "../types/UserRole";

const router = Router();
const slotsController = new SlotsController();
const slotsTableController = new SlotsTableController();

router.get(
  "/",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  slotsController.getMealSlots.bind(slotsController),
);
// Register this static path before /:id and preserve the controller context.
router.get(
  "/available",
  authenticateToken,
  authorizeRole(UserRole.HIKER, UserRole.EMPLOYEE, UserRole.WARDEN),
  slotsTableController.getAvailableSlot.bind(slotsTableController),
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  slotsController.getMealSlotById.bind(slotsController),
);
router.get(
  "/:id/details",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  slotsController.getMealSlotDetails.bind(slotsController),
);

// Used by the employee
router.post(
  "/",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  slotsController.createMealSlot.bind(slotsController),
);

router.post(
  "/:id/tables",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  slotsController.addTableToSlot.bind(slotsController),
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  slotsController.deleteMealSlot.bind(slotsController),
);
router.delete(
  "/:id/tables/:tableId",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  slotsController.removeTableFromSlot.bind(slotsController),
);

export default router;
