import { Router } from "express";
import {
  createTable,
  deleteTable,
  getTableById,
  getTableByTableNumber,
  getTables,
  resetTableOccupancy,
  updateTable,
} from "../controllers/tableController";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";
import { UserRole } from "../types/UserRole";

const router = Router();

router.get("/", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), getTables);
router.get("/:id", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), getTableById);
router.get("/number/:table_number", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), getTableByTableNumber);
router.patch("/:id/reset", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), resetTableOccupancy);

router.post("/", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), createTable);

router.patch("/:id", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), updateTable);

router.delete("/:id", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), deleteTable);

export default router;
