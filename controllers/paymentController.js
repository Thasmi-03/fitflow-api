import mongoose from "mongoose";
import { Payment } from "../models/payment.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getAllPayments = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized to access this resource." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = {};
    
    if (req.user.role !== "admin") {
      filter.userId = req.user._id;
    } else {
      if (req.query.user) filter.userId = req.query.user;
    }
    
    if (req.query.status) filter.status = req.query.status;

    const total = await Payment.countDocuments(filter);

    const payments = await Payment.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("userId", "-password");

    res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized to access this resource." });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    const paymentUserId = payment.userId._id || payment.userId;
    if (req.user.role !== "admin" && String(paymentUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Unauthorized to access this resource." });
    }

    await payment.populate("userId", "-password");

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized to access this resource." });
    }

    const { amount, currency, method, status, description } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Missing required field: amount." });
    }

    const payment = new Payment({
      userId: req.user._id,
      amount,
      currency: currency || "USD",
      method: method || "card",
      status: status || "pending",
      description: description || "",
    });

    const saved = await payment.save();
    const populated = await saved.populate("userId", "-password");

    res.status(201).json({ message: "Payment created", payment: populated });
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

export const updatePayment = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized to access this resource." });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    const paymentUserId = payment.userId._id || payment.userId;
    if (req.user.role !== "admin" && String(paymentUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Unauthorized to access this resource." });
    }

    const updated = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("userId", "-password");

    res.status(200).json({ message: "Payment updated", payment: updated });
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

export const deletePayment = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized to access this resource." });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found." });
    }

    const paymentUserId = payment.userId._id || payment.userId;
    if (req.user.role !== "admin" && String(paymentUserId) !== String(req.user._id)) {
      return res.status(403).json({ error: "Unauthorized to access this resource." });
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
