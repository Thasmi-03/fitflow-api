import { Styler } from "../models/styler.js";
import mongoose from "mongoose";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const allowedUpdateFields = ["name", "email", "phone", "country", "gender", "avatar", "metadata"];

/** GET all stylers — ADMIN ONLY */
export const getAllStylers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can access all stylers." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.name) filter.name = { $regex: req.query.name, $options: "i" };
    if (req.query.country) filter.country = req.query.country;
    if (req.query.gender) filter.gender = req.query.gender;

    const total = await Styler.countDocuments(filter);
    const stylers = await Styler.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: stylers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** GET styler by ID — owner (styler) or admin */
export const getStylerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID format" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const styler = await Styler.findById(id);
    if (!styler) return res.status(404).json({ error: "Styler not found." });

    const isOwner = req.user.role === "styler" && String(req.user._id) === String(id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Access denied." });

    res.status(200).json(styler);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** UPDATE styler — ONLY owner (styler) */
export const updateStyler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID format" });
    if (!req.user || req.user.role !== "styler") {
      return res.status(403).json({ error: "Only styler can update their profile." });
    }
    if (String(req.user._id) !== String(id)) {
      return res.status(403).json({ error: "Cannot update other stylers." });
    }

    // Block sensitive fields
    const blockedFields = ["password", "role", "_id", "createdAt", "updatedAt"];
    blockedFields.forEach(f => { if (f in req.body) delete req.body[f]; });

    // Keep only allowed fields
    const updates = {};
    Object.keys(req.body || {}).forEach(key => {
      if (allowedUpdateFields.includes(key)) updates[key] = req.body[key];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    const updated = await Styler.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (!updated) return res.status(404).json({ error: "Styler not found." });
    res.status(200).json({ message: "Styler updated", styler: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** DELETE styler — owner (styler) or admin */
export const deleteStyler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID format" });
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const isOwner = req.user.role === "styler" && String(req.user._id) === String(id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Access denied." });

    const deleted = await Styler.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Styler not found." });

    res.status(200).json({ message: "Styler deleted", styler: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
