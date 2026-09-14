import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./Config/db.js";
import customerRoutes from "./Route/Customer.route.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

// JSON Middleware
app.use(express.json());

// MongoDB Connection
connectDB();

// Test Route
app.get("/", (req, res) => {
  res.send("Client Management System API is running!");
});

// Customer Routes
app.use("/api/customers", customerRoutes);

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});