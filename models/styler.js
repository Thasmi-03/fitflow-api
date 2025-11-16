import mongoose from "mongoose";
const { Schema } = mongoose;

const StylerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    bio: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },
    age: { type: Number },
    country: { type: String, trim: true },
    skinTone: { type: String, enum: ["fair", "medium", "dark"] },
    role: { type: String, enum: ["styler", "admin"], default: "styler" },
  },
  { timestamps: true }
);

export const Styler = mongoose.model("Styler", StylerSchema);
