import { Router } from "express";
import {
    createUser,
    deleteUser,
    getUserByUsername,
    updateUser
} from "../controllers/userController";

const router = Router();

router.post("/", createUser);
router.get("/:username", getUserByUsername);
router.put("/:username", updateUser);
router.delete("/:username", deleteUser);

export default router;