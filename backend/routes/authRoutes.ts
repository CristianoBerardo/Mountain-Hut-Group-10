import { Router } from "express";
import { loginUser, registerUser } from "../controllers/authController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

router.post("/login", authenticateToken, loginUser);
router.post("/register", authenticateToken, registerUser);

export default router;