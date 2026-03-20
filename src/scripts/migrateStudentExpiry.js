import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/Student.js";

dotenv.config();

const migrateStudents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find ALL students (not just those missing expiryDate)
    const students = await Student.find({});

    console.log(`📊 Found ${students.length} students total`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const student of students) {
      try {
        // Check if already has expiry fields
        if (student.expiryDate && student.registrationDate) {
          skipped++;
          continue;
        }

        const regDate = student.createdAt || new Date();

        const guidanceStart = new Date(regDate);
        guidanceStart.setDate(guidanceStart.getDate() + 365);

        const expiry = new Date(regDate);
        expiry.setDate(expiry.getDate() + 375);

        const deletion = new Date(expiry);
        deletion.setDate(deletion.getDate() + 90);

        // Use updateOne to bypass validation
        await Student.updateOne(
          { _id: student._id },
          {
            $set: {
              registrationDate: regDate,
              careerGuidanceStartDate: guidanceStart,
              expiryDate: expiry,
              deletionScheduledAt: deletion,
              accountStatus: student.accountStatus || "active",
              isDeleted: false,
            },
          },
        );

        migrated++;

        if (migrated % 50 === 0) {
          console.log(
            `⏳ Progress: ${migrated} migrated, ${skipped} skipped...`,
          );
        }
      } catch (err) {
        console.error(
          `❌ Error migrating student ${student._id}:`,
          err.message,
        );
        errors++;
      }
    }

    console.log("\n📊 MIGRATION SUMMARY:");
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📦 Total: ${students.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrateStudents();
