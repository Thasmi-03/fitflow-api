import mongoose from "mongoose";
const { Schema } = mongoose;

const OccasionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  type: { type: String, default: "other" },
  date: { type: Date, required: true },
  location: { type: String },
  dressCode: { type: String },
  notes: { type: String },
  clothesList: [{ type: Schema.Types.ObjectId, ref: "StylerClothes" }],
  createdAt: { type: Date, default: Date.now }
});

OccasionSchema.index({ userId: 1, date: 1, type: 1 });


export const Occasion = mongoose.model("Occasion", OccasionSchema);
