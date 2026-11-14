import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();
const authController = new AuthController();

// Bind class handlers so Express preserves the controller instance.
router.post(
  "/login",
  authenticateToken,
  authController.loginUser.bind(authController),
);
router.post(
  "/register",
  authenticateToken,
  authController.registerUser.bind(authController),
);

export default router;
