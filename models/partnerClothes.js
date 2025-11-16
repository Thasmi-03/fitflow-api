import mongoose from "mongoose";
const { Schema } = mongoose;

const PartnerClothSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    image: {
      type: String,
      trim: true,
      default: "https://yourcdn.com/default-cloth.jpg"
    },
    color: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, default: 0, min: 0 },
    ownerType: { type: String, enum: ["partner"], default: "partner" },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    visibility: { type: String, enum: ["public"], default: "public" },
  },
  { timestamps: true }
);

//  search optimization
PartnerClothSchema.index({ name: "text", color: "text", category: "text" });

//  useful for filtering/sorting
PartnerClothSchema.index({ ownerId: 1, category: 1 });
PartnerClothSchema.index({ visibility: 1, ownerType: 1, createdAt: -1 });

export const PartnerCloth = mongoose.model("PartnerCloth", PartnerClothSchema);
