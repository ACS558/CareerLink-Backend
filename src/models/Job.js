import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },

    // Basic Job Info
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract"],
      default: "Full-time",
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    workMode: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      default: "On-site",
    },

    // Salary Info
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
    },
    salaryType: {
      type: String,
      enum: ["LPA", "Monthly", "Hourly"],
      default: "LPA",
    },

    // Eligibility Criteria
    eligibilityCriteria: {
      branches: {
        type: [String],
        default: [],
      },
      minCGPA: {
        type: Number,
        min: 0,
        max: 10,
      },
      maxBacklogs: {
        type: Number,
        default: 0,
      },
      graduationYears: {
        type: [Number],
        default: [],
      },
    },

    // Additional Details
    skillsRequired: {
      type: [String],
      default: [],
    },
    numberOfOpenings: {
      type: Number,
      default: 1,
    },
    applicationDeadline: {
      type: Date,
    },

    // Approval Workflow
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    approvalNotes: {
      type: String,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
jobSchema.index({ recruiterId: 1 });
jobSchema.index({ approvalStatus: 1 });
jobSchema.index({ isActive: 1 });

const Job = mongoose.model("Job", jobSchema);

export default Job;
