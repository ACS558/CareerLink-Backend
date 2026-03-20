import express from "express";
const router = express.Router();
import {
  uploadStudentPhoto,
  uploadResume,
  uploadCompanyLogo,
  deleteStudentPhoto,
  deleteResume,
} from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

// Auth for all routes
router.use(authMiddleware);

// ✅ Multer for all uploads
router.post("/photo", upload.single("photo"), uploadStudentPhoto);
router.post("/resume", upload.single("resume"), uploadResume);
router.post("/logo", upload.single("logo"), uploadCompanyLogo);
router.delete("/photo", deleteStudentPhoto);
router.delete("/resume", deleteResume);

export default router;
