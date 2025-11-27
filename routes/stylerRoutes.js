import express from "express";
import {
  getAllStylers,
  getStylerById,
  updateStyler,
  deleteStyler,
} from "../controllers/stylerController.js";
import { verifyToken } from "../middleware/auth.js";
import { verifyRole } from "../middleware/admin.js";

const router = express.Router();

// Admin only -> GET /api/stylers
router.get("/", verifyToken, verifyRole(["admin"]), getAllStylers);

// Admin + Styler (owner) -> GET specific styler
router.get("/:id", verifyToken, verifyRole(["styler", "admin"]), getStylerById);

// Styler (owner) only -> update own profile (consider ownership check in controller)
router.put("/:id", verifyToken, verifyRole(["styler"]), updateStyler);

// Styler owner or admin -> delete
router.delete("/:id", verifyToken, verifyRole(["styler", "admin"]), deleteStyler);

export default router;
