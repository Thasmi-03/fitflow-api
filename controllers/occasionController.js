import mongoose from "mongoose";
import { Occasion } from "../models/occasion.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getAllOccasions = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized to access this resource." });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = {};
    
    if (req.user.role !== "admin") {
      filter.userId = req.user._id;
    } else {
      if (req.query.user) filter.userId = req.query.user;
    }
    
    if (req.query.type) filter.type = req.query.type;

    const total = await Occasion.countDocuments(filter);

    const occasions = await Occasion.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 })
      .populate("userId", "-password")
      .populate("clothesList");

    res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: occasions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOccasionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized to access this resource." });
    }

    const occasion = await Occasion.findById(id);

    if (!occasion) {
      return res.status(404).json({ error: "Occasion not found." });
    }

    const occasionUserId = occasion.userId._id || occasion.userId;
    if (req.user.role !== "admin" && String(occasionUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Unauthorized to access this resource." });
    }

    await occasion.populate(["userId", "clothesList"]);

    res.status(200).json(occasion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createOccasion = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized to access this resource." });
    }

    if (req.user.role !== "styler") {
      return res.status(403).json({ error: "Access denied. Styler role required." });
    }

    const { title, type, date, location, dressCode, notes, clothesList } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Missing required field: title." });
    }
    if (!date) {
      return res.status(400).json({ error: "Missing required field: date." });
    }

    const occasion = new Occasion({
  userId: req.user._id,
  title,
  type: type || "other",
  date,
  location: location || "",
  dressCode: dressCode || "",
  notes: notes || "",
  clothesList: clothesList || [],  
});


    const saved = await occasion.save();
    await saved.populate(["userId", "clothesList"]);

    res.status(201).json({ message: "Occasion created", occasion: saved });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => {
        const message = e.message;
        if (message.includes("is required")) {
          return message.replace(/Path `(.+)` is required\./, "$1 is required");
        }
        return message;
      });
      return res.status(400).json({ error: errors.join(", ") });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateOccasion = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized to access this resource." });
    }

    const occasion = await Occasion.findById(id);

    if (!occasion) {
      return res.status(404).json({ error: "Occasion not found." });
    }

    const occasionUserId = occasion.userId._id || occasion.userId;
    if (req.user.role !== "admin" && String(occasionUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Unauthorized to access this resource." });
    }

    const updated = await Occasion.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    await updated.populate(["userId", "clothesList"]);

    res.status(200).json({ message: "Occasion updated", occasion: updated });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => {
        const message = e.message;
        if (message.includes("is required")) {
          return message.replace(/Path `(.+)` is required\./, "$1 is required");
        }
        return message;
      });
      return res.status(400).json({ error: errors.join(", ") });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteOccasion = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized to access this resource." });
    }

    const occasion = await Occasion.findById(id);

    if (!occasion) {
      return res.status(404).json({ error: "Occasion not found." });
    }

    const occasionUserId = occasion.userId._id || occasion.userId;
    if (req.user.role !== "admin" && String(occasionUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Unauthorized to access this resource." });
    }

    await Occasion.findByIdAndDelete(id);
    res.status(200).json({ message: "Occasion deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
