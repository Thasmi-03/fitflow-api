// server.js
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
import partnerRoutes from "./routes/partnerRoutes.js"; // protected (auth required)
import paymentRoutes from "./routes/paymentRoutes.js";
import stylerRoutes from "./routes/stylerRoutes.js";
import partnersPublicRoutes from "./routes/partnersPublicRoutes.js"; // public
import occasionRoutes from "./routes/occasionRoutes.js";

import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(express.json());
app.use(cors());

// connect to DB (keep any startup DB tasks here)
connectDB().then(async () => {
  try {
    const { dropAccountIdIndex } = await import("./models/user.js");
    await dropAccountIdIndex();
  } catch (error) {
    console.error("Error cleaning up old index:", error.message);
  }
});

// health
app.get("/", (req, res) => res.send("API running"));

// Auth & public routes
app.use("/api/auth", authRoutes);

// IMPORTANT: mount public partners under /api/partners/public
// so we don't collide with protected partner routes mounted at /api/partners
app.use("/api/partners/public", partnersPublicRoutes);

// Protected/admin/general routes
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

// Mount protected partner routes here (this contains DELETE /:id, PUT /:id, etc.)
app.use("/api/partners", partnerRoutes);

// other protected routes
app.use("/api/payment", paymentRoutes);

// Clothes & stylers
app.use("/api/stylerclothes", stylerclothesRoutes);
app.use("/api/partnerclothes", partnerclothesRoutes);
app.use("/api/styler", stylerRoutes);

app.use("/api/occasion", occasionRoutes);

// Error handler (should be last)
app.use(errorHandler);

// Optional: print mounted routes on startup to verify
function listRoutes() {
  try {
    app._router.stack.forEach((r) => {
      if (r.route && r.route.path) {
        console.log(
          Object.keys(r.route.methods).join(",").toUpperCase(),
          r.route.path
        );
      } else if (r.name === "router") {
        r.handle.stack.forEach((s) => {
          if (s.route) {
            console.log(
              Object.keys(s.route.methods).join(",").toUpperCase(),
              s.route.path
            );
          }
        });
      }
    });
  } catch (e) {
    console.warn("Could not list routes:", e.message);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  listRoutes();
});
