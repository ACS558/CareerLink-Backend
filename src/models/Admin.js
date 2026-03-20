import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    roleLevel: {
      type: String,
      enum: ["super_admin", "admin"],
      default: "admin",
    },
    personalInfo: {
      name: {
        type: String,
        required: [true, "Name is required"],
      },
      department: {
        type: String,
        default: "Training & Placement Cell",
      },
      phoneNumber: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  },
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
