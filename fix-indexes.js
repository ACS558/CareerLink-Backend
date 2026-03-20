import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("applications");

    // List current indexes
    const indexes = await collection.indexes();
    console.log("📋 Current indexes:", JSON.stringify(indexes, null, 2));

    // Drop the old index
    try {
      await collection.dropIndex("student_1_job_1");
      console.log("✅ Dropped old index: student_1_job_1");
    } catch (error) {
      console.log("ℹ️ Index student_1_job_1 not found (already removed)");
    }

    // Verify
    const newIndexes = await collection.indexes();
    console.log("📋 Updated indexes:", JSON.stringify(newIndexes, null, 2));

    await mongoose.disconnect();
    console.log("✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

fixIndexes();
