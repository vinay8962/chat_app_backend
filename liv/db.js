import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected successfully");
  });
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`);
  } catch (error) {
    console.log("MongoDB connection failed:", error);
  }
};

export default connectDB;
