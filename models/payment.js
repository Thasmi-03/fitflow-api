import mongoose from "mongoose";
import { User } from "./user.js";
const { Schema } = mongoose;

const PaymentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: User, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  method: { type: String, enum: ["card", "paypal", "stripe", "bank_transfer", "inapp"], default: "card" },
  status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

PaymentSchema.index({ userId: 1, createdAt: -1 });

export const Payment = mongoose.model("Payment", PaymentSchema);
