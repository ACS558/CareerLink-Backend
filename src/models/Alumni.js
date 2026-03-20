import mongoose from "mongoose";

const alumniSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    personalInfo: {
      firstName: {
        type: String,
        default: "",
      },
      lastName: {
        type: String,
        default: "",
      },
      phoneNumber: {
        type: String,
        default: "",
      },
      profilePicture: {
        type: String,
        default: "",
      },
    },
    academicInfo: {
      branch: {
        type: String,
        required: [true, "Branch is required"],
      },
      graduationYear: {
        type: Number,
        required: [true, "Graduation year is required"],
      },
    },
    currentRole: {
      company: {
        type: String,
        default: "",
      },
      designation: {
        type: String,
        default: "",
      },
      location: {
        type: String,
        default: "",
      },
      experience: {
        type: Number,
        default: 0,
      },
      startDate: {
        type: Date,
        default: null,
      },
    },
    externalLinks: [
      {
        name: String,
        url: String,
      },
    ],
    socialLinks: {
      linkedin: String,
      twitter: String,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Alumni = mongoose.model("Alumni", alumniSchema);

export default Alumni;
