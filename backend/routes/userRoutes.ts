import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserByUsername,
  getUsers,
  updateUser,
} from "../controllers/userController";

const router = Router();

router.get("/", getUsers);
router.post("/", createUser);
router.get("/:username", getUserByUsername);
router.put("/:username", updateUser);
router.delete("/:username", deleteUser);

export default router;
