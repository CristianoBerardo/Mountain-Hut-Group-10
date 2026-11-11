import { Router } from "express";
import { authenticateToken } from "../middleware/authenticateToken";
import { loginUser, registerUser } from "../controllers/authController";

const router = Router();

router.post("/login", authenticateToken, loginUser);
router.post("/register", authenticateToken, registerUser);

export default router;
