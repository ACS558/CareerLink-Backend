import Recruiter from "../models/Recruiter.js";
import User from "../models/User.js";
import {
  createNotification,
  notificationTemplates,
} from "../services/notificationService.js";
import {
  calculateRecruiterProfileCompletion,
  validatePhone,
  validateEmail,
  validateURL,
} from "../utils/profileHelpers.js";

// @desc    Get recruiter profile
// @route   GET /api/recruiter/profile
// @access  Private (Recruiter only)
export const getRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const recruiter = await Recruiter.findOne({ userId })
      .populate("userId", "email createdAt isActive")
      .populate("verifiedBy", "personalInfo.name");

    if (!recruiter) {
      return res.status(404).json({
        message: "Recruiter profile not found",
      });
    }

    // Calculate profile completion
    const completionPercentage = calculateRecruiterProfileCompletion(recruiter);

    res.json({
      profile: {
        email: recruiter.userId.email,
        companyInfo: recruiter.companyInfo,
        contactPerson: recruiter.contactPerson,
        verificationStatus: recruiter.verificationStatus,
        verifiedBy: recruiter.verifiedBy?.personalInfo?.name || null,
        verifiedAt: recruiter.verifiedAt,
        verificationNotes: recruiter.verificationNotes,
        isActive: recruiter.userId.isActive,
        completionPercentage: completionPercentage,
        createdAt: recruiter.createdAt,
        updatedAt: recruiter.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Recruiter Profile Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update recruiter profile
// @route   PUT /api/recruiter/profile
// @access  Private (Recruiter only)
export const updateRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    const recruiter = await Recruiter.findOne({ userId });

    if (!recruiter) {
      return res.status(404).json({
        message: "Recruiter profile not found",
      });
    }

    // Validate website URL if provided
    if (updateData.companyInfo?.website) {
      if (!validateURL(updateData.companyInfo.website)) {
        return res.status(400).json({
          message: "Invalid website URL",
        });
      }
    }

    // Validate contact person phone if provided
    if (updateData.contactPerson?.phoneNumber) {
      if (!validatePhone(updateData.contactPerson.phoneNumber)) {
        return res.status(400).json({
          message: "Invalid phone number format",
        });
      }
    }

    // Validate contact person email if provided
    if (updateData.contactPerson?.email) {
      if (!validateEmail(updateData.contactPerson.email)) {
        return res.status(400).json({
          message: "Invalid email format",
        });
      }
    }

    // Update company info
    if (updateData.companyInfo) {
      recruiter.companyInfo = {
        ...recruiter.companyInfo,
        ...updateData.companyInfo,
      };
    }

    // Update contact person
    if (updateData.contactPerson) {
      recruiter.contactPerson = {
        ...recruiter.contactPerson,
        ...updateData.contactPerson,
      };
    }

    await recruiter.save();

    const completionPercentage = calculateRecruiterProfileCompletion(recruiter);

    res.json({
      message: "Profile updated successfully",
      profile: {
        companyInfo: recruiter.companyInfo,
        contactPerson: recruiter.contactPerson,
        completionPercentage: completionPercentage,
      },
    });
  } catch (error) {
    console.error("Update Recruiter Profile Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
