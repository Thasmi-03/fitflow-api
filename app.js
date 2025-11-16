import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import "./models/index.js";
import express from "express";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import stylerclothesRoutes from "./routes/stylerClothesRoutes.js";
import partnerclothesRoutes from "./routes/partnerClothesRoutes.js";
import partnerRoutes from "./routes/partnerRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import stylerRoutes from "./routes/stylerRoutes.js";
import partnersPublicRoutes from "./routes/partnersPublicRoutes.js";
import occasionRoutes from "./routes/occasionRoutes.js";

import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(cors());

connectDB().then(async () => {
  try {
    const { dropAccountIdIndex } = await import("./models/user.js");
    await dropAccountIdIndex();
  } catch (error) {
    console.error("Error cleaning up old index:", error.message);
  }
});

app.get("/", (req, res) => res.send("API running"));

// Public/auth routes
app.use("/api/auth", authRoutes);
app.use("/api/partners", partnersPublicRoutes);

// Admin & general protected routes
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/payment", paymentRoutes);

// Correct route wiring: clothes vs cloth vs styler
app.use("/api/stylerclothes", stylerclothesRoutes); // collection of clothes endpoints
app.use("/api/partnerclothes", partnerclothesRoutes); // single-cloth or partner-managed cloth endpoints (if you meant that)
app.use("/api/styler", stylerRoutes);

app.use("/api/occasion", occasionRoutes);

app.use(errorHandler);

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
