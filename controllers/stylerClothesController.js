// controllers/stylerClothesController.js
import mongoose from "mongoose";
import { StylerClothes } from "../models/stylerClothes.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getMyStylerClothes = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { search, category, color, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(req.user._id)) {
      console.warn("getMyStylerClothes: req.user._id is not a valid ObjectId:", req.user._id);
      return res.status(400).json({ error: "Invalid user id" });
    }
    const ownerId = new mongoose.Types.ObjectId(String(req.user._id));

    const filter = { ownerId };

    if (category) filter.category = category;
    if (color) filter.color = color;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (search) filter.name = { $regex: search, $options: "i" };

    console.log("getMyStylerClothes filter:", JSON.stringify(filter));

    const skip = (Number(page) - 1) * Number(limit);

    const clothesData = await StylerClothes.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const clothes = clothesData.map(item => ({
      ...item,
      id: item._id.toString(),
      imageUrl: item.image,
      description: item.note,
      userId: item.ownerId.toString()
    }));

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

    const cloth = await StylerClothes.findById(id).lean();
    if (!cloth) return res.status(404).json({ error: "Cloth not found" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const isOwner = String(cloth.ownerId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

    const transformedCloth = {
      ...cloth,
      id: cloth._id.toString(),
      imageUrl: cloth.image,
      description: cloth.note,
      userId: cloth.ownerId.toString()
    };

    res.status(200).json({ clothes: transformedCloth });
  } catch (error) {
    console.error("getStylerClothById error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const createStylerCloth = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "styler") return res.status(403).json({ error: "Styler role required" });

    const { name, color, category, skinTone, gender, age, image, note } = req.body;
    if (!name || !color || !category || !skinTone || !gender) {
      return res.status(400).json({ error: "Missing required fields: name, color, category, skinTone, gender" });
    }

    if (!isValidObjectId(req.user._id)) {
      console.warn("createStylerCloth: req.user._id is not a valid ObjectId:", req.user._id);
      return res.status(400).json({ error: "Invalid user id" });
    }
    const ownerId = new mongoose.Types.ObjectId(String(req.user._id));

    const cloth = new StylerClothes({
      name,
      color,
      category,
      skinTone,
      gender,
      age: age || undefined,
      image: image || undefined,
      note: note || "",
      ownerId,
      visibility: "private",
    });

    const saved = await cloth.save();
    
    const transformedCloth = {
      ...saved.toObject(),
      id: saved._id.toString(),
      imageUrl: saved.image,
      description: saved.note,
      userId: saved.ownerId.toString()
    };
    
    res.status(201).json({ message: "Cloth created", clothes: transformedCloth });
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

    const updated = await StylerClothes.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).lean();
    
    
    const transformedCloth = {
      ...updated,
      id: updated._id.toString(),
      imageUrl: updated.image,
      description: updated.note,
      userId: updated.ownerId.toString()
    };
    
    res.status(200).json({ message: "Cloth updated", clothes: transformedCloth });
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
