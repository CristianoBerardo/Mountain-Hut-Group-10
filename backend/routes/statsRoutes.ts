import { Router } from "express";
import { getStats } from "../controllers/statsController";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";

const router = Router();

router.get("/", authenticateToken, authorizeRole("ADMIN"), getStats);

export default router;