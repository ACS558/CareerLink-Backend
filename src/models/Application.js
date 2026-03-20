import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
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

    // Application Status
    status: {
      type: String,
      enum: ["applied", "shortlisted", "rejected", "selected", "pending"],
      default: "applied",
    },

    // AI Match Score (will be added in Phase 6)
    atsScore: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      strengths: [String],
      weaknesses: [String],
      recommendation: {
        type: String,
        enum: ["Highly recommended", "Recommended", "Maybe", "Not recommended"],
      },
      calculatedAt: Date,
    },

    // Application Details
    coverLetter: {
      type: String,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },

    // Recruiter Actions
    shortlistedAt: {
      type: Date,
    },
    shortlistedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    selectedAt: {
      type: Date,
    },

    // Notes
    recruiterNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to prevent duplicate applications
applicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });

// Index for faster queries
applicationSchema.index({ studentId: 1, status: 1 });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ recruiterId: 1, status: 1 });

export default mongoose.model("Application", applicationSchema);
