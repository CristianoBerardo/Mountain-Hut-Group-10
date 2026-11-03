import { Router } from "express";
import {
  addTableToSlot,
  createMealSlot,
  deleteSlot,
  getSlotById,
  getSlotDetails,
  getSlots,
  removeTableFromSlot,
} from "../controllers/slotsController";
import { getAvailableSlot } from "../controllers/slotsTableController";

const router = Router();

router.get("/", getSlots);
router.get("/available", getAvailableSlot);

router.get("/:id", getSlotById);
router.get("/:id/details", getSlotDetails);

// Used by the employee
router.post("/", createMealSlot);

router.post("/:id/tables", addTableToSlot);

router.delete("/:id", deleteSlot);
router.delete("/:id/tables/:tableId", removeTableFromSlot);

export default router;
