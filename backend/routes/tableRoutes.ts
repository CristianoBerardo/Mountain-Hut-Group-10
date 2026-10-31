import { Router } from "express";
import {
  createTable,
  deleteTable,
  getTableById,
  getTableByTableNumber,
  getTables,
  updateTable,
} from "../controllers/tableController";

const router = Router();

router.get("/", getTables);
router.get("/:id", getTableById);
router.get("/number/:table_number ", getTableByTableNumber);

router.post("/", createTable);

router.patch("/:id", updateTable);

router.delete("/:id", deleteTable);

export default router;
