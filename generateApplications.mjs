import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// ─── REPLACE WITH YOUR CONNECTION STRING ─────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI;

const JOB_ID = "";
const RECRUITER_ID = "";

// ─── HELPER DATA ─────────────────────────────────────────────────────────────
const strengths = [
  "Strong JavaScript skills",
  "Good React experience",
  "Solid Node.js knowledge",
  "Excellent problem solving",
  "Good understanding of databases",
  "Strong Python skills",
  "Good Git knowledge",
  "Experience with REST APIs",
  "Good communication skills",
  "Strong algorithmic thinking",
];

const weaknesses = [
  "Limited cloud experience",
  "No Docker experience",
  "Limited team project experience",
  "No internship experience",
  "Weak system design knowledge",
  "Limited backend experience",
  "No CI/CD knowledge",
  "Limited testing experience",
];

const coverLetters = [
  "I am a passionate software engineering student with strong foundations in web development. I believe my skills align well with this role.",
  "With hands-on experience in React and Node.js, I am confident I can contribute effectively to your team.",
  "I have been working on various full-stack projects and am eager to apply my skills in a professional environment.",
  "My academic background and project experience make me a strong candidate for this position.",
  "I am highly motivated and have developed strong technical skills through academics and personal projects.",
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// ─── SCHEMAS ─────────────────────────────────────────────────────────────────
const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    registrationNumber: String,
    academicInfo: {
      branch: String,
      cgpa: Number,
      backlogs: { type: Number, default: 0 },
    },
    skills: [String],
  },
  { timestamps: true },
);

const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected", "selected", "pending"],
      default: "applied",
    },
    atsScore: {
      score: { type: Number, min: 0, max: 100 },
      strengths: [String],
      weaknesses: [String],
      recommendation: {
        type: String,
        enum: ["Highly recommended", "Recommended", "Maybe", "Not recommended"],
      },
      calculatedAt: Date,
    },
    coverLetter: String,
    appliedAt: { type: Date, default: Date.now },
    shortlistedAt: Date,
    shortlistedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectedAt: Date,
    rejectionReason: String,
    selectedAt: Date,
    recruiterNotes: String,
  },
  { timestamps: true },
);

applicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);
const Application =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const main = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.\n");

    // Fetch eligible students — CSE or IT with 0 backlogs
    const eligibleStudents = await Student.find({
      "academicInfo.branch": { $in: ["CSE", "IT"] },
      "academicInfo.backlogs": 0,
    }).limit(100);

    console.log(
      `Found ${eligibleStudents.length} eligible students (CSE/IT, 0 backlogs)\n`,
    );

    if (eligibleStudents.length === 0) {
      console.log("No eligible students found. Check your student data.");
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const student of eligibleStudents) {
      try {
        // Check if application already exists
        const existing = await Application.findOne({
          jobId: new mongoose.Types.ObjectId(JOB_ID),
          studentId: student._id,
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Generate ATS score
        const atsScore = randomInt(45, 95);
        const numStrengths = randomInt(2, 4);
        const numWeaknesses = randomInt(1, 3);
        const studentStrengths = [...strengths]
          .sort(() => 0.5 - Math.random())
          .slice(0, numStrengths);
        const studentWeaknesses = [...weaknesses]
          .sort(() => 0.5 - Math.random())
          .slice(0, numWeaknesses);

        // Determine recommendation based on score
        let recommendation;
        if (atsScore >= 80) recommendation = "Highly recommended";
        else if (atsScore >= 65) recommendation = "Recommended";
        else if (atsScore >= 50) recommendation = "Maybe";
        else recommendation = "Not recommended";

        // Determine status based on ATS score
        let status;
        if (atsScore >= 80)
          status = Math.random() < 0.6 ? "shortlisted" : "applied";
        else if (atsScore >= 65)
          status = Math.random() < 0.3 ? "shortlisted" : "applied";
        else if (atsScore < 50)
          status = Math.random() < 0.4 ? "rejected" : "applied";
        else status = "applied";

        // Random applied date
        const appliedAt = randomDate(new Date(2025, 0, 1), new Date());

        const application = {
          jobId: new mongoose.Types.ObjectId(JOB_ID),
          studentId: student._id,
          recruiterId: new mongoose.Types.ObjectId(RECRUITER_ID),
          status,
          atsScore: {
            score: atsScore,
            strengths: studentStrengths,
            weaknesses: studentWeaknesses,
            recommendation,
            calculatedAt: appliedAt,
          },
          coverLetter: randomFrom(coverLetters),
          appliedAt,
          ...(status === "shortlisted" && {
            shortlistedAt: new Date(appliedAt.getTime() + 86400000),
          }),
          ...(status === "rejected" && {
            rejectedAt: new Date(appliedAt.getTime() + 86400000),
            rejectionReason: "Does not meet all requirements",
          }),
          ...(status === "selected" && {
            selectedAt: new Date(appliedAt.getTime() + 172800000),
          }),
        };

        await Application.create(application);
        created++;

        if (created % 20 === 0)
          console.log(`Created ${created} applications...`);
      } catch (err) {
        if (err.code === 11000) {
          skipped++;
          continue;
        }
        throw err;
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`   Created : ${created} applications`);
    console.log(`   Skipped : ${skipped} (already existed)`);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
};

main();
