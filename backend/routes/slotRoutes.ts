import { Router } from "express";
import { addSlotTable, createSlot, deleteSlot, getSlotById, getSlots, removeSlotTable } from "../controllers/slotController";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";
import { UserRole } from "../types/UserRole";

const router = Router();
const employeeAccess = [
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
];

router.get("/", getSlots);
router.get("/:id", getSlotById);
router.post("/", ...employeeAccess, createSlot);
router.delete("/:id", ...employeeAccess, deleteSlot);
router.post("/:id/tables", ...employeeAccess, addSlotTable);
router.delete("/:id/tables/:tableId", ...employeeAccess, removeSlotTable);

export default router;
