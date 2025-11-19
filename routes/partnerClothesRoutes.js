import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyRole } from "../middleware/admin.js";
import {
  createCloth,
  getPublicCloths,
  getMyCloths,
  getClothById,
  updateCloth,
  deleteCloth,
  getSuggestions
} from "../controllers/partnerClothesController.js";

const router = express.Router();

// Public route
router.get("/", getPublicCloths);

// Partner routes
router.post("/", verifyToken, verifyRole(["partner"]), createCloth);
router.get("/mine", verifyToken, verifyRole(["partner"]), getMyCloths);

// Styler route
router.get("/suggestions", verifyToken, verifyRole(["styler"]), getSuggestions);

// Individual cloth routes
router.get("/:id", getClothById);
router.put("/:id", verifyToken, verifyRole(["partner"]), updateCloth);
router.delete("/:id", verifyToken, verifyRole(["partner"]), deleteCloth);

export default router;
