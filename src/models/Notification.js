import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Recipient
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userRole: {
      type: String,
      enum: ["student", "recruiter", "admin", "alumni"],
      required: true,
    },

    // Notification Content
    type: {
      type: String,
      enum: [
        "new_post",
        "new_post_admin",
        "new_job_posted",
        "new_job_pending",
        "new_alumni_registration",
        "new_recruiter_registration",
        "job_approved",
        "job_rejected",
        "application_received",
        "application_shortlisted",
        "application_rejected",
        "application_selected",
        "application_pending",
        "recruiter_approved",
        "recruiter_rejected",
        "alumni_approved",
        "alumni_rejected",
        "profile_completed",
        "extension_request",
        "extension_approved",
        "extension_rejected",
        "new_referral_pending",
        "referral_approved",
        "referral_rejected",
        "new_referral_posted",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },

    // Related Documents
    relatedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    relatedApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Notification Status
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },

    // Action Link
    actionUrl: {
      type: String,
    },

    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster queries
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userRole: 1 });

export default mongoose.model("Notification", notificationSchema);
