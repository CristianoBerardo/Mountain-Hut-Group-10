import { Router } from "express";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";
import { UserRole } from "../types/UserRole";
import { UserController } from "../controllers/userController";

const router = Router();

const userController = new UserController();

router.get(
  "/",
  authenticateToken,
  authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN),
  userController.getUsers.bind(userController),
);

router.get(
  "/:firebase_uid",
  userController.getUserByFirebaseUid.bind(userController),
);

export default router;
