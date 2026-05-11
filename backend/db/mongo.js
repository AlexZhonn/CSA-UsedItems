import mongoose, { mongo } from "mongoose";
import dotenv from "dotenv";
dotenv.config;
const mongoURI = process.env.MONGO_URI;

const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err);
  }
};

export default connectMongo;
