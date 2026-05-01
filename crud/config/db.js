const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || "";
  const allowInMemory = process.env.ALLOW_IN_MEMORY_DB !== "false";

  if (!mongoUri && !allowInMemory) {
    throw new Error("MONGO_URI is not defined in environment variables.");
  }

  try {
    if (!mongoUri) {
      throw new Error("MONGO_URI is missing");
    }
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    if (!allowInMemory) {
      throw error;
    }

    memoryServer = await MongoMemoryServer.create();
    const inMemoryUri = memoryServer.getUri();
    await mongoose.connect(inMemoryUri);
    console.log("MongoDB in-memory fallback connected");
  }
};

module.exports = connectDB;
