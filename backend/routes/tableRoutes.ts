import { Router } from "express";
import { TableController } from "../controllers/tableController";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";
import { UserRole } from "../types/UserRole";

const router = Router();
const tableController = new TableController();

router.get(
  "/",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  tableController.getTables.bind(tableController),
);
router.get(
  "/:id",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  tableController.getTableById.bind(tableController),
);
router.get(
  "/number/:table_number",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  tableController.getTableByTableNumber.bind(tableController),
);
router.patch(
  "/:id/reset",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  tableController.resetTableOccupancy.bind(tableController),
);

router.post(
  "/",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  tableController.createTable.bind(tableController),
);

router.patch(
  "/:id",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  tableController.updateTable.bind(tableController),
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  tableController.deleteTable.bind(tableController),
);

export default router;
