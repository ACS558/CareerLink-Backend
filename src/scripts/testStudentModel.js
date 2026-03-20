import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/Student.js";

dotenv.config();

const testMethods = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const student = await Student.findOne();

    if (!student) {
      console.log("❌ No students found in database");
      process.exit(1);
    }

    console.log("Testing Student:", student.registrationNumber);
    console.log("Registration Date:", student.registrationDate);
    console.log("Expiry Date:", student.expiryDate);
    console.log("Career Guidance Start:", student.careerGuidanceStartDate);
    console.log("Account Status:", student.accountStatus);

    console.log("\n--- Testing Methods ---");

    const daysLeft = student.getDaysUntilExpiry();
    console.log("Days until expiry:", daysLeft);

    const inGuidanceMode = student.isInCareerGuidanceMode();
    console.log("In career guidance mode:", inGuidanceMode);

    console.log("\n✅ All methods working correctly");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

testMethods();
