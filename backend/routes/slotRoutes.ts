import { Router } from "express";
import {
  addTableToSlot,
  createMealSlot,
  deleteSlot,
  // getAvailableSlot,
  getSlotById,
  getSlots,
  removeTableFromSlot,
} from "../controllers/slotsController";
import { getAvailableSlot } from "../controllers/slotsTableController";

const router = Router();

// Public routes for slots
router.get("/", getSlots);
router.get("/available", getAvailableSlot);
router.get("/:id", getSlotById);

// In V2 they will be proteccted, for now they are public
router.post("/", createMealSlot);
router.post("/:id/tables", addTableToSlot);

router.delete("/:id", deleteSlot);
router.delete("/:id/tables/:tableId", removeTableFromSlot);

export default router;
