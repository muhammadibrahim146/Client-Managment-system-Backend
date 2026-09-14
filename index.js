import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./Config/db.js";
import customerRoutes from "./Route/Customer.route.js";

dotenv.config();

const app = express();

// CORS
app.use(
  cors({
    origin: "https://client-managment-system-frontend-my.vercel.app",
  })
);

// JSON
app.use(express.json());

// Test Route
app.get("/", async (req, res) => {
  res.json({
    success: true,
    message: "Client Management System API is running!",
  });
});

// Customer Routes
app.use("/api/customers", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
}, customerRoutes);

// Vercel
export default app;

// Start Server
