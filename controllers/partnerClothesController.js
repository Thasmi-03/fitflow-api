import mongoose from "mongoose";
import { PartnerCloth } from "../models/partnerClothes.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/** Pagination helper */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit || "10", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/** Build filter from query */
function buildFilterFromQuery(query, extras = {}) {
  const filter = { ...extras };

  if (query.search) {
    const q = query.search.trim();
    const regex = { $regex: q, $options: "i" };
    filter.$or = [{ name: regex }, { color: regex }, { category: regex }];
  }

  if (query.category) filter.category = query.category;
  if (query.color) filter.color = { $regex: query.color, $options: "i" };

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice != null) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice != null) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.ownerId && isValidObjectId(query.ownerId)) {
    filter.ownerId = query.ownerId;
  }

  if (query.visibility) filter.visibility = query.visibility;
  if (query.ownerType) filter.ownerType = query.ownerType;

  return filter;
}

/** Parse sort string like "createdAt:desc,price:asc" */
function parseSort(sortStr) {
  if (!sortStr) return { createdAt: -1 };
  const sort = {};
  sortStr.split(",").forEach((part) => {
    const [field, dir] = part.split(":").map((s) => s.trim());
    if (!field) return;
    sort[field] = dir === "asc" ? 1 : -1;
  });
  return sort;
}

/** ---------------------- CRUD & LIST FUNCTIONS ---------------------- **/

/** Create cloth */
export const createCloth = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "partner") return res.status(403).json({ error: "Partner role required" });

    const { name, color, category, price, image } = req.body;
    if (!name || !color || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const cloth = new PartnerCloth({
      name,
      color,
      category,
      price: price || 0,
      image: image || "https://yourcdn.com/default-cloth.jpg",
      ownerType: "partner",
      ownerId: req.user._id,
      visibility: "public",
    });

    const saved = await cloth.save();
    res.status(201).json({ message: "Cloth created", cloth: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** Get single cloth by ID */
export const getClothById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID" });

    const cloth = await PartnerCloth.findById(id);
    if (!cloth) return res.status(404).json({ error: "Cloth not found" });

    if (cloth.visibility === "private") {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const isOwner = String(cloth.ownerId) === String(req.user._id);
      const isAdmin = req.user.role === "admin";
      if (!isOwner && !isAdmin) return res.status(403).json({ error: "Access denied" });
    }

    res.status(200).json(cloth);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** Update cloth */
export const updateCloth = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID" });

    const cloth = await PartnerCloth.findById(id);
    if (!cloth) return res.status(404).json({ error: "Cloth not found" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const isOwner = String(cloth.ownerId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Access denied" });

    const updated = await PartnerCloth.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    res.status(200).json({ message: "Cloth updated", cloth: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** Delete cloth */
export const deleteCloth = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID" });

    const cloth = await PartnerCloth.findById(id);
    if (!cloth) return res.status(404).json({ error: "Cloth not found" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const isOwner = String(cloth.ownerId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Access denied" });

    await PartnerCloth.findByIdAndDelete(id);
    res.status(200).json({ message: "Cloth deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** List public cloths with search/filter/pagination/sort */
export const getPublicCloths = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const sort = parseSort(req.query.sort);
    const extras = { visibility: "public", ownerType: "partner" };
    const filter = buildFilterFromQuery(req.query, extras);

    const [total, clothes] = await Promise.all([
      PartnerCloth.countDocuments(filter),
      PartnerCloth.find(filter).sort(sort).skip(skip).limit(limit),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));
    res.status(200).json({ meta: { total, page, limit, pages }, data: clothes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** List my cloths (partner) */
export const getMyCloths = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { page, limit, skip } = parsePagination(req.query);
    const sort = parseSort(req.query.sort);
    const extras = { ownerId: req.user._id };
    const filter = buildFilterFromQuery(req.query, extras);

    const [total, clothes] = await Promise.all([
      PartnerCloth.countDocuments(filter),
      PartnerCloth.find(filter).sort(sort).skip(skip).limit(limit),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));
    res.status(200).json({ meta: { total, page, limit, pages }, data: clothes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** Suggestions for stylers */
export const getSuggestions = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "styler") return res.status(403).json({ error: "Styler role required" });

    const { page, limit, skip } = parsePagination(req.query);
    const sort = parseSort(req.query.sort);
    const extras = { visibility: "public", ownerType: "partner" };
    const filter = buildFilterFromQuery(req.query, extras);

    const [total, suggestions] = await Promise.all([
      PartnerCloth.countDocuments(filter),
      PartnerCloth.find(filter).sort(sort).skip(skip).limit(limit),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));
    res.status(200).json({ meta: { total, page, limit, pages }, data: suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
