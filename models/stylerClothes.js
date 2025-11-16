import mongoose from "mongoose";
const { Schema } = mongoose;

const StylerClothesSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    color: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
    ownerType: { type: String, enum: ["styler"], default: "styler" },
    ownerId: { type: Schema.Types.ObjectId, ref: "Styler", required: true, index: true },
    visibility: { type: String, enum: ["private"], default: "private" },
  },
  { timestamps: true }
);

StylerClothesSchema.index({ ownerId: 1, category: 1 });

export const StylerClothes = mongoose.model("StylerClothes", StylerClothesSchema);
