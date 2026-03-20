import express from "express";
const router = express.Router();
import {
  applyForJob,
  getMyApplications,
  getApplicationById,
  withdrawApplication,
  getRecruiterApplications,
  getJobApplications,
  updateApplicationStatus,
  bulkUpdateApplications,
  recalculateATSScores,
  exportJobApplications,
  autoShortlistByATS,
} from "../controllers/applicationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

// Student routes
router.post("/", authMiddleware, roleMiddleware("student"), applyForJob);
router.get(
  "/my-applications",
  authMiddleware,
  roleMiddleware("student"),
  getMyApplications,
);
router.get("/:id", authMiddleware, getApplicationById);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("student"),
  withdrawApplication,
);

// Recruiter routes
router.get(
  "/recruiter/all",
  authMiddleware,
  roleMiddleware("recruiter"),
  getRecruiterApplications,
);
router.get(
  "/job/:jobId",
  authMiddleware,
  roleMiddleware("recruiter"),
  getJobApplications,
);
router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware("recruiter"),
  updateApplicationStatus,
);
router.patch(
  "/bulk-update",
  authMiddleware,
  roleMiddleware("recruiter"),
  bulkUpdateApplications,
);

router.post(
  "/job/:jobId/calculate-scores",
  authMiddleware,
  roleMiddleware("recruiter"),
  recalculateATSScores,
);

router.get(
  "/job/:jobId/export",
  authMiddleware,
  roleMiddleware(["recruiter"]),
  exportJobApplications,
);

router.post(
  "/job/:jobId/auto-shortlist",
  authMiddleware,
  roleMiddleware(["recruiter"]),
  autoShortlistByATS,
);

export default router;
