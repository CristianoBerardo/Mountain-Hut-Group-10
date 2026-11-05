import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserByUsername,
  getUsers,
  updateUser,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";
import { UserRole } from "../types/UserRole";

const router = Router();

router.get("/", authenticateToken, authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN), getUsers);
router.post("/", createUser);
router.get("/:username", getUserByUsername);
router.put("/:username", updateUser);
router.delete("/:username", deleteUser);

export default router;
