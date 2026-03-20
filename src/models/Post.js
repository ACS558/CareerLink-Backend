import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    // Author Information
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorRole: {
      type: String,
      required: true,
      enum: ["admin", "recruiter", "alumni"],
      index: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorPhoto: {
      type: String,
      default: null,
    },

    // Content
    contentType: {
      type: String,
      required: true,
      enum: ["text", "text-image", "text-document", "mixed"],
      default: "text",
    },
    textContent: {
      type: String,
      required: true,
      maxlength: 5000,
    },

    // Media - Images
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Media - Documents
    documents: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        fileName: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
          enum: ["pdf", "xlsx", "xls", "docx", "doc"],
        },
        fileSize: {
          type: Number,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Job Link (Optional)
    linkedJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },
    isJobPost: {
      type: Boolean,
      default: false,
    },

    // Pin Status
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },

    // Deletion (Soft Delete)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },

    // Analytics
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Compound Indexes for efficient queries
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ isPinned: -1, createdAt: -1 });
postSchema.index({ isDeleted: 1, isPinned: -1, createdAt: -1 });
postSchema.index({ authorRole: 1, createdAt: -1 });

// Virtual for unique view count (will be calculated separately)
postSchema.virtual("uniqueViews", {
  ref: "PostView",
  localField: "_id",
  foreignField: "postId",
  count: true,
});

const Post = mongoose.model("Post", postSchema);

export default Post;
