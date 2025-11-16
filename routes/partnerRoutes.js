import express from "express";
import {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
} from "../controllers/partnerController.js";
import { verifyToken } from "../middleware/auth.js";
import { verifyRole } from "../middleware/admin.js";

const router = express.Router();

router.get("/", verifyToken, verifyRole(["admin", "partner"]), getAllPartners);
router.get(
  "/:id",
  verifyToken,
  verifyRole(["admin", "partner"]),
  getPartnerById
);
router.post("/", verifyToken, verifyRole("partner"), createPartner);
router.put("/:id", verifyToken, verifyRole("partner"), updatePartner);
router.delete(
  "/:id",
  verifyToken,
  verifyRole(["admin", "partner"]),
  deletePartner
);

export default router;
