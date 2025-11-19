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

    // Build filter object
    const filter = {};
    
    // User-based filtering
    if (req.user.role !== "admin") {
      filter.userId = req.user._id;
    } else {
      if (req.query.user) filter.userId = req.query.user;
    }
    
    // Existing filters
    if (req.query.type) filter.type = req.query.type;
    
    // NEW: Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate);
      }
    }
    
    // NEW: Location filtering
    if (req.query.location) {
      filter.location = { $regex: req.query.location, $options: 'i' };
    }
    
    // NEW: Dress code filtering
    if (req.query.dressCode) {
      filter.dressCode = { $regex: req.query.dressCode, $options: 'i' };
    }

    // NEW: Search functionality (searches in title, location, dressCode, notes)
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { location: searchRegex },
        { dressCode: searchRegex },
        { notes: searchRegex }
      ];
    }

    const total = await Occasion.countDocuments(filter);

    // NEW: Sorting options
    let sortOption = { date: -1 }; // default sort by date descending
    
    if (req.query.sort) {
      const sortField = req.query.sort;
      const sortOrder = req.query.order === 'asc' ? 1 : -1;
      
      const allowedSortFields = ['title', 'date', 'type', 'location', 'dressCode', 'createdAt'];
      if (allowedSortFields.includes(sortField)) {
        sortOption = { [sortField]: sortOrder };
      }
    }

    const occasions = await Occasion.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sortOption)
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