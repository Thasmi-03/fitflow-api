import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  getMyProfile,
  updateUser,
  deleteUser
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();

// PUBLIC / AUTH PROFILE endpoints (declare BEFORE global admin middleware)

// 1) Get profile of logged-in user (no id) — requires token
router.get("/profile", verifyToken, getMyProfile);

// 2) Get profile by id — requires token but NOT admin (optional; you can make this public/admin as needed)
router.get("/profile/:id", verifyToken, getUserById);

// From here on, routes require admin
router.use(verifyToken);
router.use(requireAdmin);

router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
