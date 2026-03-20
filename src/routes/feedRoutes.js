import express from "express";
import {
  createPost,
  getFeed,
  getPostById,
  updatePost,
  deletePost,
  pinPost,
  unpinPost,
  trackView,
  getPostAnalytics,
  removeImage,
  removeDocument,
} from "../controllers/feedController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create post (Admin, Recruiter, Alumni only)
router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["admin", "recruiter", "alumni"]),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "documents", maxCount: 3 },
  ]),
  createPost,
);

// Get feed (All roles, role-based filtering applied in controller)
router.get("/", getFeed);

// Get single post
router.get("/:id", getPostById);

// Update post (Author only, checked in controller)
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "recruiter", "alumni"]),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "documents", maxCount: 3 },
  ]),
  updatePost,
);

// Delete post (Author or Admin, checked in controller)
router.delete("/:id", deletePost);

// Pin post (Author or Admin, checked in controller)
router.put(
  "/:id/pin",
  roleMiddleware(["admin", "recruiter", "alumni"]),
  pinPost,
);

// Unpin post (Author or Admin, checked in controller)
router.put(
  "/:id/unpin",
  roleMiddleware(["admin", "recruiter", "alumni"]),
  unpinPost,
);

// Track view (All roles)
router.post("/:id/view", trackView);

// Get analytics (Author or Admin, checked in controller)
router.get(
  "/analytics/:id",
  roleMiddleware(["admin", "recruiter", "alumni"]),
  getPostAnalytics,
);

// Remove image from post (Author only, checked in controller)
router.delete(
  "/:id/image",
  roleMiddleware(["admin", "recruiter", "alumni"]),
  removeImage,
);

// Remove document from post (Author only, checked in controller)
router.delete(
  "/:id/document",
  roleMiddleware(["admin", "recruiter", "alumni"]),
  removeDocument,
);

export default router;
