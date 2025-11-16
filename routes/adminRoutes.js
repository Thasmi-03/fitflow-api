import express from "express";
import {
  approveUser,
  getPendingUsers,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(requireAdmin);
 
// Admin only routes
router.get("/pending", getPendingUsers);
router.put("/approve/:userId", approveUser);

export default router;

