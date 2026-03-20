import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyInfo: {
      companyName: {
        type: String,
        required: [true, "Company name is required"],
        trim: true,
      },
      companyLogo: {
        type: String,
        default: "",
      },
      industry: {
        type: String,
        required: [true, "Industry is required"],
      },
      website: {
        type: String,
        default: "",
      },
      companySize: {
        type: String,
        default: "",
      },
      location: {
        type: String,
        required: [true, "Location is required"],
      },
      description: {
        type: String,
        default: "",
      },
    },
    contactPerson: {
      name: {
        type: String,
        required: [true, "Contact person name is required"],
      },
      designation: {
        type: String,
        required: [true, "Designation is required"],
      },
      phoneNumber: {
        type: String,
        required: [true, "Phone number is required"],
      },
      email: {
        type: String,
        required: [true, "Contact email is required"],
      },
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
    verificationNotes: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    companyLogo: {
      url: String,
      publicId: String,
    },
  },
  {
    timestamps: true,
  },
);

const Recruiter = mongoose.model("Recruiter", recruiterSchema);

export default Recruiter;
