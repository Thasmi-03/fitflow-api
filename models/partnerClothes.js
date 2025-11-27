import mongoose from "mongoose";
const { Schema } = mongoose;

const PartnerClothSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, trim: true, default: "https://yourcdn.com/default-cloth.jpg" },
    color: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, default: 0, min: 0 },
    ownerType: { type: String, enum: ["partner"], default: "partner" },
    ownerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true, index: true },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    size: { type: String, required: true, trim: true },

    // Extra fields
    material: { type: String, trim: true },
    season: [{ type: String, trim: true }],
    occasionTags: [{ type: String, trim: true }],
    wearable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text indexes for search
PartnerClothSchema.index({ name: "text", color: "text", category: "text", brand: "text" });
PartnerClothSchema.index({ price: 1 });
PartnerClothSchema.index({ visibility: 1, ownerType: 1, createdAt: -1 });

export const PartnerCloth = mongoose.model("PartnerCloth", PartnerClothSchema);
