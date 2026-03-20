import express from "express";
import {
  getStudentDashboardStats,
  getRecruiterDashboardStats,
  getAdminDashboardStats,
  getAdvancedAnalytics,
  exportData,
} from "../controllers/analyticsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Student analytics
router.get(
  "/student/dashboard",
  authMiddleware,
  roleMiddleware("student"),
  getStudentDashboardStats,
);

// Recruiter analytics
router.get(
  "/recruiter/dashboard",
  authMiddleware,
  roleMiddleware("recruiter"),
  getRecruiterDashboardStats,
);

// Admin analytics
router.get(
  "/admin/dashboard",
  authMiddleware,
  roleMiddleware("admin"),
  getAdminDashboardStats,
);

router.get(
  "/admin/advanced",
  authMiddleware,
  roleMiddleware("admin"),
  getAdvancedAnalytics,
);

// Export data
router.get(
  "/admin/export",
  authMiddleware,
  roleMiddleware("admin"),
  exportData,
);

export default router;
