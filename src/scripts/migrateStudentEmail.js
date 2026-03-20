import mongoose from "mongoose";
import Student from "../models/Student.js";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const migrateStudentEmails = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("📦 Connected to MongoDB");

    const students = await Student.find({}).populate("userId");
    let updated = 0;
    let skipped = 0;

    for (const student of students) {
      if (student.userId && student.userId.email) {
        // Update email in personalInfo
        await Student.updateOne(
          { _id: student._id },
          {
            $set: {
              "personalInfo.email": student.userId.email.toLowerCase(),
            },
          },
        );
        updated++;
        console.log(
          `✅ Updated ${student.registrationNumber}: ${student.userId.email}`,
        );
      } else {
        skipped++;
        console.log(`⚠️ Skipped ${student.registrationNumber}: No email found`);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️ Skipped: ${skipped}`);
    console.log(`   📝 Total: ${students.length}`);

    await mongoose.disconnect();
    console.log("\n✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
};

migrateStudentEmails();
