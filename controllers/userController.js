import { User } from "../models/user.js";
import mongoose from "mongoose";

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.email) filter.email = { $regex: req.query.email, $options: "i" };
    if (req.query.role) filter.role = req.query.role;

    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Invalid ID format" });

    const user = await User.findById(req.params.id).select("-password");

    if (!user) return res.status(404).json({ error: "User not found." });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new user
export const createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    const userResponse = savedUser.toJSON();
    delete userResponse.password;
    res.status(201).json({ message: "User created", user: userResponse });
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

// Update a user by ID
export const updateUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Invalid ID format" });

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) return res.status(404).json({ error: "User not found." });

    res.status(200).json({ message: "User updated", user: updatedUser });
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

// Delete a user by ID
export const deleteUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ error: "Invalid ID format" });

    const deletedUser = await User.findByIdAndDelete(req.params.id).select("-password");

    if (!deletedUser) return res.status(404).json({ error: "User not found." });

    res.status(200).json({ message: "User deleted", user: deletedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
