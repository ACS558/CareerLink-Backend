import express from "express";
import {
  getStudentProfile,
  updateStudentProfile,
  getProfileCompletion,
  getStudentDashboard,
  requestAccountExtension,
  getApprovedReferrals,
} from "../controllers/studentController.js";
import { getMyPlacements } from "../controllers/placementController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication and student role
router.use(authMiddleware);
router.use(roleMiddleware(["student"]));

// Profile routes
router.get("/profile", getStudentProfile);
router.put("/profile", updateStudentProfile);
router.get("/profile/completion", getProfileCompletion);
router.get("/dashboard", authMiddleware, getStudentDashboard);
router.post("/request-extension", authMiddleware, requestAccountExtension);

// Placement management
router.get("/placements", authMiddleware, getMyPlacements);
router.get("/referrals", getApprovedReferrals);

export default router;
