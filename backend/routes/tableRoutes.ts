import { Router } from "express";
import { getAllTables } from "../controllers/tableController";

const router = Router();

router.get("/", getAllTables);

export default router;
