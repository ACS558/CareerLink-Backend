import express from "express";
import {
  getAdminProfile,
  updateAdminProfile,
  getAllRecruiters,
  getPendingRecruiters,
  verifyRecruiter,
  getAllAlumni,
  getPendingAlumni,
  verifyAlumni,
  getDashboardStats,
  getAllStudents,
  getExtensionRequests,
  reviewExtensionRequest,
  getExtensionStats,
  getAdminJobDetails,
  adminUpdateApplicationStatus,
  exportJobApplications,
  createAdmin,
  getAllAdmins,
  deleteAdmin,
  getPendingReferrals,
  getAllReferrals,
  verifyReferral,
} from "../controllers/adminController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";
import { getAllApplicationsAdmin } from "../controllers/applicationController.js";
import { bulkUpdateApplications } from "../controllers/applicationController.js";
import { superAdminOnly } from "../middleware/superAdminMiddleware.js";

import {
  getAllJobsAdmin,
  getPendingJobs,
  verifyJob,
} from "../controllers/jobController.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware(["admin"]));

// Profile routes
router.get("/profile", getAdminProfile);
router.put("/profile", updateAdminProfile);

// Recruiter management routes
router.get("/recruiters", getAllRecruiters);
router.get("/recruiters/pending", getPendingRecruiters);
router.put("/recruiters/:id/verify", verifyRecruiter);

// Alumni management routes
router.get("/alumni", getAllAlumni);
router.get("/alumni/pending", getPendingAlumni);
router.put("/alumni/:id/verify", verifyAlumni);

// Student management routes
router.get("/students", getAllStudents);

// Dashboard routes
router.get("/dashboard/stats", getDashboardStats);

// Job routes
router.get("/jobs", getAllJobsAdmin);
router.get("/jobs/pending", getPendingJobs);
router.put("/jobs/:id/verify", verifyJob);

// Application routes
router.get(
  "/applications",
  authMiddleware,
  roleMiddleware("admin"),
  getAllApplicationsAdmin,
);

// ========== EXTENSION REQUEST ROUTES ==========
router.get(
  "/extension-requests",
  authMiddleware,
  roleMiddleware(["admin"]),
  getExtensionRequests,
);

router.get(
  "/extension-requests/stats",
  authMiddleware,
  roleMiddleware(["admin"]),
  getExtensionStats,
);

router.post(
  "/extension-requests/:studentId/:requestId/review",
  authMiddleware,
  roleMiddleware(["admin"]),
  reviewExtensionRequest,
);

router.get(
  "/jobs/:jobId",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAdminJobDetails,
);
router.put(
  "/applications/:id/status",
  authMiddleware,
  roleMiddleware(["admin"]),
  adminUpdateApplicationStatus,
);
router.get(
  "/jobs/:jobId/export",
  authMiddleware,
  roleMiddleware(["admin"]),
  exportJobApplications,
);
router.patch(
  "/applications/bulk-update",
  authMiddleware,
  roleMiddleware(["admin"]),
  bulkUpdateApplications,
);

router.post("/admins", superAdminOnly, createAdmin);

router.get("/admins", superAdminOnly, getAllAdmins);

router.delete("/admins/:id", superAdminOnly, deleteAdmin);

router.get("/referrals/pending", getPendingReferrals);

router.get("/referrals", getAllReferrals);

router.put("/referrals/:id/verify", verifyReferral);
export default router;
