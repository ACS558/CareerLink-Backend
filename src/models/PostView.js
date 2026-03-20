import mongoose from "mongoose";

const postViewSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    viewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    viewerRole: {
      type: String,
      required: true,
      enum: ["student", "admin", "recruiter", "alumni"],
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  },
);

// Unique index to prevent duplicate views from same user
postViewSchema.index({ postId: 1, viewedBy: 1 }, { unique: true });

// Index for analytics queries
postViewSchema.index({ postId: 1, viewedAt: -1 });
postViewSchema.index({ postId: 1, viewerRole: 1 });

const PostView = mongoose.model("PostView", postViewSchema);

export default PostView;
