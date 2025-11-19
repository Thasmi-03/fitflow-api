// models/stylerClothes.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const StylerClothesSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    color: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
    ownerId: { type: Schema.Types.ObjectId, ref: "Styler", required: true, index: true },
    visibility: { type: String, enum: ["private"], default: "private" },
    // If you later want to support public/shared items, change enum accordingly
    // ownerType removed because schema doesn't need it for current logic
  },
  { timestamps: true }
);

StylerClothesSchema.index({ ownerId: 1, category: 1 });

export const StylerClothes = mongoose.model("StylerClothes", StylerClothesSchema);
