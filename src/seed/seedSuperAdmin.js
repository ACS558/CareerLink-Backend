import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import User from "../models/User.js";
import Admin from "../models/Admin.js";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const existingAdmin = await Admin.findOne({ roleLevel: "super_admin" });

    if (existingAdmin) {
      console.log("Super Admin already exists");
      process.exit();
    }

    const password = await bcrypt.hash("admin123", 10);

    const user = await User.create({
      email: "superadmin@college.edu",
      password,
      role: "admin",
      isVerified: true,
      isActive: true,
    });

    await Admin.create({
      userId: user._id,
      roleLevel: "super_admin",
      personalInfo: {
        name: "System Administrator",
        department: "Training & Placement Cell",
      },
    });

    console.log("Super Admin created successfully");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedSuperAdmin();
