import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    // Already connected
    if (mongoose.connection.readyState === 1) {
      return;
    }

    // Connection is currently being established
    if (mongoose.connection.readyState === 2) {
      return;
    }

    await mongoose.connect(process.env.MONGODB_URL);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

export default connectDB;