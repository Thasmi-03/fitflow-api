// controllers/partnerController.js
import mongoose from "mongoose";
import Partner from "../models/partner.js";

/** helpers */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const allowedUpdateFields = ["name", "email", "phone", "address", "company", "avatar", "metadata"];

/**
 * NOTE:
 * - POST (createPartner) and GET all (getAllPartners) are intentionally disabled (405).
 * - Only authenticated PARTNER (req.user.role === "partner") who owns the id (req.user._id === req.params.id)
 *   can GET their profile, UPDATE, or DELETE themselves.
 */

/** GET all partners — DISABLED */
export const getAllPartners = async (req, res) => {
  return res.status(405).json({ error: "GET /partners (all) is disabled." });
};

/** CREATE partner — DISABLED */
export const createPartner = async (req, res) => {
  return res.status(405).json({ error: "POST /partners is disabled." });
};

/** Get partner by id — partner must be owner */
export const getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID format" });

    // Auth check
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "partner") {
      return res.status(403).json({ error: "Only partners can access partner profiles." });
    }
    if (String(req.user._id) !== String(id)) {
      return res.status(403).json({ error: "Access denied: can only access your own profile." });
    }

    const partner = await Partner.findById(id);
    if (!partner) return res.status(404).json({ error: "Partner not found." });

    res.status(200).json(partner);
  } catch (error) {
    console.error("getPartnerById error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

/** Update partner — ONLY partner owner can update (admin NOT allowed) */
export const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID format" });

    // Auth & role & ownership checks
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "partner") {
      return res.status(403).json({ error: "Only partners can update their profile." });
    }
    if (String(req.user._id) !== String(id)) {
      return res.status(403).json({ error: "Access denied: can only update your own profile." });
    }

    // Block sensitive fields
    const blockedFields = ["password", "role", "_id", "createdAt", "updatedAt"];
    blockedFields.forEach((f) => {
      if (f in req.body) delete req.body[f];
    });

    // Build updates only from allowedUpdateFields
    const updates = {};
    Object.keys(req.body || {}).forEach((key) => {
      if (allowedUpdateFields.includes(key)) updates[key] = req.body[key];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update." });
    }

    const updated = await Partner.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (!updated) return res.status(404).json({ error: "Partner not found." });
    res.status(200).json({ message: "Partner updated", partner: updated });
  } catch (error) {
    console.error("updatePartner error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => {
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

/** Delete partner — ONLY partner owner can delete (admin NOT allowed) */
export const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID format" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "partner") {
      return res.status(403).json({ error: "Only partners can delete their account." });
    }
    if (String(req.user._id) !== String(id)) {
      return res.status(403).json({ error: "Access denied: can only delete your own account." });
    }

    const deleted = await Partner.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Partner not found." });

    // Optional: cascade-delete related resources (clothes, orders) here if you want.

    res.status(200).json({ message: "Partner deleted", partner: deleted });
  } catch (error) {
    console.error("deletePartner error:", error);
    res.status(500).json({ error: error.message });
  }
};
