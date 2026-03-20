import express from "express";
const router = express.Router();
import {
  createJob,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob,
  getAllApprovedJobs,
} from "../controllers/jobController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

// All routes require authentication and admin role
router.use(authMiddleware);

// Student routes - browse approved jobs
router.get("/", roleMiddleware(["student", "admin"]), getAllApprovedJobs);
router.get("/:id", getJobById);

// Recruiter routes
router.post("/", roleMiddleware(["recruiter"]), createJob);
router.get("/my-jobs/all", roleMiddleware(["recruiter"]), getMyJobs);
router.put("/:id", roleMiddleware(["recruiter"]), updateJob);
router.delete("/:id", roleMiddleware(["recruiter"]), deleteJob);

export default router;
