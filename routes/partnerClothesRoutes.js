// server/Api/routes/partnerClothesRoutes.js
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

router.get("/public", getPublicCloths);
router.get("/mine", verifyToken, getMyCloths);
router.get("/suggestions", verifyToken, verifyRole("styler"), getSuggestions);
router.post("/", verifyToken, verifyRole("partner"), createCloth);
router.get("/:id", getClothById);
router.put("/:id", verifyToken, verifyRole("partner"), updateCloth);
router.delete("/:id", verifyToken, verifyRole("partner"), deleteCloth);

export default router;
