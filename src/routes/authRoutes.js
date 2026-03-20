import express from "express";
import {
  registerStudent,
  registerRecruiter,
  registerAdmin,
  registerAlumni,
  login,
} from "../controllers/authController.js";

const router = express.Router();

// Registration routes
router.post("/register/student", registerStudent);
router.post("/register/recruiter", registerRecruiter);
router.post("/register/admin", registerAdmin);
router.post("/register/alumni", registerAlumni);

// Login route
router.post("/login", login);

export default router;
