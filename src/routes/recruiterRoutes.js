import express from "express";
import {
  getRecruiterProfile,
  updateRecruiterProfile,
} from "../controllers/recruiterController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes require authentication and recruiter role
router.use(authMiddleware);
router.use(roleMiddleware(["recruiter"]));

// Profile routes
router.get("/profile", getRecruiterProfile);
router.put("/profile", updateRecruiterProfile);

export default router;
