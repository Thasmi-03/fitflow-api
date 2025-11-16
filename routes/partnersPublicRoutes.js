import express from "express";
import { User } from "../models/user.js";

const router = express.Router();

// Public: list approved partners
router.get("/", async (_req, res) => {
  try {
    const partners = await User.find({ role: "partner", isApproved: true }).select("-password").sort({ createdAt: -1 });
    return res.status(200).json(partners);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;

