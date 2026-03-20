import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Recruiter from "../models/Recruiter.js";
import Admin from "../models/Admin.js";
import Alumni from "../models/Alumni.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided. Authorization denied.",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found. Authorization denied.",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is not active. Please contact admin.",
      });
    }

    // Attach basic user info to request
    req.user = {
      userId: user._id,
      role: user.role,
      email: user.email,
      isVerified: user.isVerified,
    };

    // Get role-specific document based on user role
    let roleDoc;
    switch (user.role) {
      case "student":
        roleDoc = await Student.findOne({ userId: user._id });
        break;
      case "recruiter":
        roleDoc = await Recruiter.findOne({ userId: user._id });
        break;
      case "admin":
        roleDoc = await Admin.findOne({ userId: user._id });
        break;
      case "alumni":
        roleDoc = await Alumni.findOne({ userId: user._id });
        break;
      default:
        return res.status(400).json({
          message: "Invalid user role",
        });
    }

    if (!roleDoc) {
      return res.status(404).json({
        message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} profile not found. Please complete registration.`,
      });
    }

    // Attach role document to request
    req.user.roleDoc = roleDoc;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token. Authorization denied.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired. Please login again.",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      message: "Server error in authentication",
      error: error.message,
    });
  }
};
