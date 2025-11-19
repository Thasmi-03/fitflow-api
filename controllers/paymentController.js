import mongoose from "mongoose";
import { Payment } from "../models/payment.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ===== CREATE PAYMENT =====
export const createPayment = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { amount, currency, method, status, description } = req.body || {};

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: "Missing required field: amount" });
    }

    const payment = new Payment({
      userId: req.user._id,
      amount: Number(amount),
      currency: currency || "USD",
      method: method || "card",
      status: status || "pending",
      description: description || "",
    });

    const saved = await payment.save();

    const populated = await Payment.findById(saved._id).populate("userId", "-password");

    res.status(201).json({ message: "Payment created", payment: populated });
  } catch (error) {
    console.error("createPayment error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===== GET ALL PAYMENTS =====
export const getAllPayments = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 50);
    const skip = (page - 1) * limit;

    const filter = {};

    // Admin sees all, others see only their own
    if (req.user.role !== "admin") {
      filter.userId = req.user._id;
    } else if (req.query.user && isValidObjectId(req.query.user)) {
      filter.userId = req.query.user;
    }

    if (req.query.status) filter.status = req.query.status;

    const total = await Payment.countDocuments(filter);

    const payments = await Payment.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("userId", "-password")
      .lean();

    res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    console.error("getAllPayments error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===== GET PAYMENT BY ID =====
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID" });
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const payment = await Payment.findById(id).populate("userId", "-password");

    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const paymentUserId = payment.userId?._id || payment.userId;

    if (req.user.role !== "admin" && String(paymentUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error("getPaymentById error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===== UPDATE PAYMENT =====
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID" });
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const paymentUserId = payment.userId?._id || payment.userId;
    if (req.user.role !== "admin" && String(paymentUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await Payment.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
      .populate("userId", "-password");

    res.status(200).json({ message: "Payment updated", payment: updated });
  } catch (error) {
    console.error("updatePayment error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ===== DELETE PAYMENT =====
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid ID" });
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const paymentUserId = payment.userId?._id || payment.userId;
    if (req.user.role !== "admin" && String(paymentUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await Payment.findByIdAndDelete(id);
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("deletePayment error:", error);
    res.status(500).json({ error: error.message });
  }
};
