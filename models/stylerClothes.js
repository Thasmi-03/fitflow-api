// models/stylerClothes.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const StylerClothesSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    color: { 
      type: String, 
      required: true, 
      trim: true,
      enum: ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'brown', 'pink', 'purple', 'orange', 'beige', 'navy', 'maroon', 'teal', 'coral', 'multi']
    },
    category: { 
      type: String, 
      required: true, 
      trim: true,
      enum: ['dress', 'shirt', 'pants', 'jacket', 'skirt', 'top', 'shorts', 'suit', 'gown', 'blazer', 'sweater', 'coat']
    },
    skinTone: {
      type: String,
      enum: ['fair', 'light', 'medium', 'tan', 'deep', 'dark'],
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'unisex'],
      required: true
    },
    age: {
      type: Number,
      min: 0,
      max: 120
    },
    note: { type: String, trim: true, default: "" },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "Styler",
      required: true,
      index: true
    },

    visibility: {
      type: String,
      enum: ["private"],
      default: "private"
    },
  },
  { timestamps: true }
);

StylerClothesSchema.index({ ownerId: 1, category: 1 });

export const StylerClothes = mongoose.model("StylerClothes", StylerClothesSchema);
