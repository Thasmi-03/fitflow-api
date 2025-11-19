// controllers/stylerClothesController.js
import mongoose from "mongoose";
import { StylerClothes } from "../models/stylerClothes.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getMyStylerClothes = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { search, category, color, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    // --- SAFER ownerId creation: use `new` and validate ---
    if (!isValidObjectId(req.user._id)) {
      console.warn("getMyStylerClothes: req.user._id is not a valid ObjectId:", req.user._id);
      return res.status(400).json({ error: "Invalid user id" });
    }
    const ownerId = new mongoose.Types.ObjectId(String(req.user._id));

    // rely on ownerId only (schema doesn't have ownerType)
    const filter = { ownerId };

    if (category) filter.category = category;
    if (color) filter.color = color;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (search) filter.name = { $regex: search, $options: "i" };

    console.log("getMyStylerClothes filter:", JSON.stringify(filter));

    const skip = (Number(page) - 1) * Number(limit);

    const clothes = await StylerClothes.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await StylerClothes.countDocuments(filter);
    const totalPages = Math.ceil(total / Number(limit) || 1);

    res.status(200).json({ page: Number(page), limit: Number(limit), total, totalPages, clothes });
  } catch (error) {
    console.error("getMyStylerClothes error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getStylerClothById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID" });

    const cloth = await StylerClothes.findById(id);
    if (!cloth) return res.status(404).json({ error: "Cloth not found" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const isOwner = String(cloth.ownerId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

    res.status(200).json(cloth);
  } catch (error) {
    console.error("getStylerClothById error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createStylerCloth = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "styler") return res.status(403).json({ error: "Styler role required" });

    const { name, color, category, price, image, visibility } = req.body;
    if (!name || !color || !category) return res.status(400).json({ error: "Missing required fields" });

    // Ensure ownerId is valid ObjectId
    if (!isValidObjectId(req.user._id)) {
      console.warn("createStylerCloth: req.user._id is not a valid ObjectId:", req.user._id);
      return res.status(400).json({ error: "Invalid user id" });
    }
    const ownerId = new mongoose.Types.ObjectId(String(req.user._id));

    const cloth = new StylerClothes({
      name,
      color,
      category,
      price: price || 0,
      image: image || undefined,
      ownerId, // pass ObjectId instance
      visibility: visibility || "private",
    });

    const saved = await cloth.save();
    res.status(201).json({ message: "Cloth created", cloth: saved });
  } catch (error) {
    console.error("createStylerCloth error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateStylerCloth = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID" });

    const cloth = await StylerClothes.findById(id);
    if (!cloth) return res.status(404).json({ error: "Cloth not found" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const isOwner = String(cloth.ownerId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

    const updated = await StylerClothes.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    res.status(200).json({ message: "Cloth updated", cloth: updated });
  } catch (error) {
    console.error("updateStylerCloth error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteStylerCloth = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID" });

    const cloth = await StylerClothes.findById(id);
    if (!cloth) return res.status(404).json({ error: "Cloth not found" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const isOwner = String(cloth.ownerId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

    await StylerClothes.findByIdAndDelete(id);
    res.status(200).json({ message: "Cloth deleted successfully" });
  } catch (error) {
    console.error("deleteStylerCloth error:", error);
    res.status(500).json({ error: error.message });
  }
};
