import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
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
      email: {
        type: String,
        default: "",
        lowercase: true,
        trim: true,
      },
      phoneNumber: {
        type: String,
        default: "",
      },
      dateOfBirth: {
        type: Date,
        default: null,
      },
      gender: {
        type: String,
        enum: ["Male", "Female", "Other", ""],
        default: "",
      },
      profilePicture: {
        type: String,
        default: "",
      },
    },
    academicInfo: {
      department: {
        type: String,
        default: "",
      },
      branch: {
        type: String,
        uppercase: true,
        default: "",
      },
      semester: {
        type: Number,
        default: null,
      },
      cgpa: {
        type: Number,
        default: null,
      },
      percentage: {
        type: Number,
        default: null,
      },
      backlogs: {
        type: Number,
        default: 0,
      },
      graduationYear: {
        type: Number,
        default: null,
      },
    },
    skills: [
      {
        type: String,
      },
    ],
    resume: {
      type: String,
      default: "",
    },
    resumeText: {
      type: String,
      default: "",
    },
    projects: [
      {
        title: String,
        description: String,
        technologies: [String],
        liveLink: String,
        githubLink: String,
      },
    ],
    internships: [
      {
        companyName: String,
        role: String,
        duration: String,
        description: String,
        startDate: Date,
        endDate: Date,
      },
    ],
    certifications: [
      {
        name: String,
        issuedBy: String,
        issueDate: Date,
        credentialUrl: String,
      },
    ],
    externalLinks: [
      {
        name: String,
        url: String,
      },
    ],
    socialLinks: {
      linkedin: String,
      github: String,
      portfolio: String,
    },
    placementStatus: {
      type: String,
      enum: ["unplaced", "placed", "pursuing_higher_studies"],
      default: "unplaced",
    },
    placedCompany: {
      type: String,
      default: "",
    },
    package: {
      type: Number,
      default: null,
    },
    placedAt: {
      type: Date,
      default: null,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    photo: {
      url: String,
      publicId: String,
    },
    resume: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      parsedData: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    registrationDate: {
      type: Date,
      required: false,
      default: Date.now,
      immutable: true,
    },

    expiryDate: {
      type: Date,
      required: false,
    },

    careerGuidanceStartDate: {
      type: Date,
      required: false,
    },

    accountStatus: {
      type: String,
      enum: ["active", "career_guidance_mode", "expired", "deleted"],
      default: "active",
      index: true,
    },

    // Extension requests
    extensionRequests: [
      {
        reason: String,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        reviewedBy: mongoose.Schema.Types.ObjectId,
        reviewedAt: Date,
      },
    ],

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,

    deletionScheduledAt: Date,
    placements: [
      {
        company: {
          type: String,
          required: true,
        },
        jobTitle: {
          type: String,
          default: "",
        },
        package: {
          type: Number,
          required: true,
        },
        offerDate: {
          type: Date,
          default: Date.now,
        },
        joiningDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined"],
          default: "pending",
        },
        offerLetter: {
          url: String,
          publicId: String,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        metadata: {
          jobId: mongoose.Schema.Types.ObjectId,
          applicationId: mongoose.Schema.Types.ObjectId,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

studentSchema.virtual("primaryPlacement").get(function () {
  if (this.placements && this.placements.length > 0) {
    // Return the primary placement or the first accepted one
    const primary = this.placements.find(
      (p) => p.isPrimary && p.status === "accepted",
    );
    if (primary) return primary;

    const firstAccepted = this.placements.find((p) => p.status === "accepted");
    if (firstAccepted) return firstAccepted;

    return this.placements[0];
  }
  return null;
});

// ============================================
// MIDDLEWARE - CALCULATE EXPIRY DATES
// ============================================
studentSchema.pre("save", async function () {
  // ✅ No 'next' parameter - just async function

  // Only run on NEW documents
  if (this.isNew) {
    const regDate = this.registrationDate || new Date();

    // Set registrationDate
    if (!this.registrationDate) {
      this.registrationDate = regDate;
    }

    // Career guidance starts at day 365
    const guidanceStart = new Date(regDate);
    guidanceStart.setDate(guidanceStart.getDate() + 365);
    this.careerGuidanceStartDate = guidanceStart;

    // Account expires at day 375
    const expiry = new Date(regDate);
    expiry.setDate(expiry.getDate() + 375);
    this.expiryDate = expiry;

    // Deletion scheduled 90 days after expiry
    const deletion = new Date(expiry);
    deletion.setDate(deletion.getDate() + 90);
    this.deletionScheduledAt = deletion;

    // Set defaults
    if (!this.accountStatus) {
      this.accountStatus = "active";
    }
    if (this.isDeleted === undefined) {
      this.isDeleted = false;
    }
  }
  // ✅ NEW: Auto-sync placement status based on placements array
  if (this.placements && this.placements.length > 0) {
    // Find primary or first accepted placement
    const primary = this.placements.find(
      (p) => p.isPrimary && p.status === "accepted",
    );
    const firstAccepted = this.placements.find((p) => p.status === "accepted");
    const activePlacement = primary || firstAccepted || this.placements[0];

    if (activePlacement) {
      // Update old fields for backward compatibility
      this.placementStatus = "placed";
      this.placedCompany = activePlacement.company;
      this.package = activePlacement.package;
      this.placedAt = activePlacement.offerDate;
    }
  } else {
    // No placements - set to unplaced
    this.placementStatus = "unplaced";
    this.placedCompany = "";
    this.package = null;
    this.placedAt = null;
  }
  // ✅ No next() call needed
});

// ============================================
// METHODS
// ============================================
studentSchema.methods.getDaysUntilExpiry = function () {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

studentSchema.methods.isInCareerGuidanceMode = function () {
  const today = new Date();
  const guidanceStart = new Date(this.careerGuidanceStartDate);
  const expiry = new Date(this.expiryDate);
  return today >= guidanceStart && today < expiry;
};

// ============================================
// CREATE MODEL
// ============================================
const Student = mongoose.model("Student", studentSchema);
export default Student;
