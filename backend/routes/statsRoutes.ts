import { Router } from "express";
import { getStats } from "../controllers/statsController";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";
import { UserRole } from "../types/UserRole";

const router = Router();

router.get("/", authenticateToken, authorizeRole(UserRole.EMPLOYEE), getStats);

export default router;