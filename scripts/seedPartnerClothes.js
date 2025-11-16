import mongoose from "mongoose";
import { PartnerCloth } from "../models/partnerClothes.js";

const MONGO_URI = "mongodb+srv://YOUR_CONNECTION_STRING_HERE";

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const partner1 = new mongoose.Types.ObjectId("650000000000000000000001");
    const partner2 = new mongoose.Types.ObjectId("650000000000000000000002");

    await PartnerCloth.insertMany([
      { name: "Blue Summer Dress", color: "Blue", category: "Dress", price: 1200, ownerType: "partner", ownerId: partner1, visibility: "public" },
      { name: "Red Party Gown", color: "Red", category: "Gown", price: 4500, ownerType: "partner", ownerId: partner1, visibility: "public" },
      { name: "Green Kurta", color: "Green", category: "Kurta", price: 800, ownerType: "partner", ownerId: partner2, visibility: "public" }
    ]);

    console.log(" Partner clothes seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error(" Seeding failed:", error);
    process.exit(1);
  }
};

seed();
