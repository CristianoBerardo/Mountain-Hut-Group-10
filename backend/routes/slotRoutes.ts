import { Router } from "express";
import {
  addTableToSlot,
  createMealSlot,
  deleteMealSlot,
  getMealSlotById,
  getMealSlotDetails,
  getMealSlots,
  removeTableFromSlot,
} from "../controllers/slotsController";
import { getAvailableSlot } from "../controllers/slotsTableController";

const router = Router();

router.get("/", getMealSlots);
router.get("/available", getAvailableSlot);

router.get("/:id", getMealSlotById);
router.get("/:id/details", getMealSlotDetails);

// Used by the employee
router.post("/", createMealSlot);

router.post("/:id/tables", addTableToSlot);

router.delete("/:id", deleteMealSlot);
router.delete("/:id/tables/:tableId", removeTableFromSlot);

export default router;
