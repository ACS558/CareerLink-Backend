import express from "express";
import authRoutes from "./authRoutes.js";
import studentRoutes from "./studentRoutes.js";
import recruiterRoutes from "./recruiterRoutes.js";
import adminRoutes from "./adminRoutes.js";
import alumniRoutes from "./alumniRoutes.js";
import jobRoutes from "./jobRoutes.js";
import applicationRoutes from "./applicationRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import feedRoutes from './feedRoutes.js';

const router = express.Router();

router.use("/student", studentRoutes);
router.use("/recruiter", recruiterRoutes);
router.use("/admin", adminRoutes);
router.use("/alumni", alumniRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/upload", uploadRoutes);
router.use("/notifications", notificationRoutes);
router.use("/analytics", analyticsRoutes);
router.use('/feed', feedRoutes);

// Mount auth routes
router.use("/auth", authRoutes);

// Health check route
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "CareerLink API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
