import Student from "../models/Student.js";
import User from "../models/User.js";
import {
  calculateStudentProfileCompletion,
  validateCGPA,
  validatePercentage,
  validatePhone,
  validateURL,
  validateGraduationYear,
} from "../utils/profileHelpers.js";
import Referral from "../models/Referral.js";

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private (Student only)
export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const student = await Student.findOne({ userId }).populate(
      "userId",
      "email createdAt",
    );

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    // Calculate profile completion
    const completionPercentage = calculateStudentProfileCompletion(student);

    // ✅ DEBUG LOGS
    console.log("📸 Photo in DB:", student.photo);
    console.log("📄 Resume in DB:", student.resume);

    res.json({
      profile: {
        registrationNumber: student.registrationNumber,
        email: student.userId.email,
        personalInfo: student.personalInfo,
        academicInfo: student.academicInfo,
        skills: student.skills,
        projects: student.projects,
        internships: student.internships,
        certifications: student.certifications,
        externalLinks: student.externalLinks,
        socialLinks: student.socialLinks,
        placementStatus: student.placementStatus,
        placedCompany: student.placedCompany,
        package: student.package,
        profileCompleted: student.profileCompleted,
        completionPercentage: completionPercentage,
        photo: student.photo, // ✅ ADD THIS
        resume: student.resume, // ✅ ADD THIS
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Student Profile Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private (Student only)
export const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    const student = await Student.findOne({ userId });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    // Validate CGPA if provided
    if (updateData.academicInfo?.cgpa) {
      if (!validateCGPA(updateData.academicInfo.cgpa)) {
        return res.status(400).json({
          message: "CGPA must be between 0 and 10",
        });
      }
    }

    // Validate Percentage if provided
    if (updateData.academicInfo?.percentage) {
      if (!validatePercentage(updateData.academicInfo.percentage)) {
        return res.status(400).json({
          message: "Percentage must be between 0 and 100",
        });
      }
    }

    // Validate Phone if provided
    if (updateData.personalInfo?.phoneNumber) {
      if (!validatePhone(updateData.personalInfo.phoneNumber)) {
        return res.status(400).json({
          message: "Invalid phone number format",
        });
      }
    }

    // Validate Graduation Year if provided
    if (updateData.academicInfo?.graduationYear) {
      if (!validateGraduationYear(updateData.academicInfo.graduationYear)) {
        return res.status(400).json({
          message: "Invalid graduation year",
        });
      }
    }

    // Validate URLs in external links
    if (updateData.externalLinks && Array.isArray(updateData.externalLinks)) {
      for (const link of updateData.externalLinks) {
        if (link.url && !validateURL(link.url)) {
          return res.status(400).json({
            message: `Invalid URL: ${link.url}`,
          });
        }
      }
    }

    // Update fields
    if (updateData.personalInfo) {
      student.personalInfo = {
        ...student.personalInfo,
        ...updateData.personalInfo,
      };
    }

    if (updateData.academicInfo) {
      student.academicInfo = {
        ...student.academicInfo,
        ...updateData.academicInfo,
      };
    }

    if (updateData.skills) {
      student.skills = updateData.skills;
    }

    if (updateData.projects) {
      student.projects = updateData.projects;
    }

    if (updateData.internships) {
      student.internships = updateData.internships;
    }

    if (updateData.certifications) {
      student.certifications = updateData.certifications;
    }

    if (updateData.externalLinks) {
      student.externalLinks = updateData.externalLinks;
    }

    if (updateData.socialLinks) {
      student.socialLinks = {
        ...student.socialLinks,
        ...updateData.socialLinks,
      };
    }

    // Calculate completion and update flag
    const completionPercentage = calculateStudentProfileCompletion(student);
    student.profileCompleted = completionPercentage >= 80; // 80% threshold

    await student.save();

    res.json({
      message: "Profile updated successfully",
      profile: {
        registrationNumber: student.registrationNumber,
        personalInfo: student.personalInfo,
        academicInfo: student.academicInfo,
        skills: student.skills,
        projects: student.projects,
        internships: student.internships,
        certifications: student.certifications,
        externalLinks: student.externalLinks,
        socialLinks: student.socialLinks,
        profileCompleted: student.profileCompleted,
        completionPercentage: completionPercentage,
      },
    });
  } catch (error) {
    console.error("Update Student Profile Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get profile completion percentage
// @route   GET /api/student/profile/completion
// @access  Private (Student only)
export const getProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.userId;

    const student = await Student.findOne({ userId });

    if (!student) {
      return res.status(404).json({
        message: "Student profile not found",
      });
    }

    const completionPercentage = calculateStudentProfileCompletion(student);

    // Detailed breakdown
    const breakdown = {
      personalInfo: {
        completed: !!(
          student.personalInfo.firstName &&
          student.personalInfo.lastName &&
          student.personalInfo.phoneNumber &&
          student.personalInfo.dateOfBirth &&
          student.personalInfo.gender
        ),
        percentage: 20,
      },
      academicInfo: {
        completed: !!(
          student.academicInfo.branch &&
          student.academicInfo.semester &&
          student.academicInfo.cgpa &&
          student.academicInfo.percentage &&
          student.academicInfo.graduationYear
        ),
        percentage: 25,
      },
      skills: {
        completed: student.skills && student.skills.length > 0,
        percentage: 15,
      },
      projects: {
        completed: student.projects && student.projects.length > 0,
        percentage: 15,
      },
      internships: {
        completed: student.internships && student.internships.length > 0,
        percentage: 10,
      },
      certifications: {
        completed: student.certifications && student.certifications.length > 0,
        percentage: 10,
      },
      socialLinks: {
        completed: !!(
          student.socialLinks?.linkedin || student.socialLinks?.github
        ),
        percentage: 5,
      },
    };

    res.json({
      completionPercentage: completionPercentage,
      profileCompleted: student.profileCompleted,
      breakdown: breakdown,
      message:
        completionPercentage >= 80
          ? "Profile is complete!"
          : `Profile is ${completionPercentage}% complete. Complete it to access all features.`,
    });
  } catch (error) {
    console.error("Get Profile Completion Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get dashboard data with career guidance mode
// @route   GET /api/student/dashboard
// @access  Private (Student)
export const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const student = await Student.findOne({ userId })
      .populate("userId", "email")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Calculate days until expiry
    const today = new Date();
    const expiryDate = new Date(student.expiryDate);
    const diffTime = expiryDate - today;
    const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if in career guidance mode
    const careerGuidanceStart = new Date(student.careerGuidanceStartDate);
    const isInCareerGuidanceMode =
      today >= careerGuidanceStart && today < expiryDate;

    res.json({
      success: true,
      dashboardMode: isInCareerGuidanceMode ? "career_guidance" : "normal",
      daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
      accountStatus: student.accountStatus,
      placementStatus: student.placementStatus || "unplaced",
      student: {
        name: `${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`,
        email: student.userId.email,
        registrationNumber: student.registrationNumber,
        placedCompany: student.placedCompany,
        package: student.package,

        placements: student.placements || [],
        totalPlacements: student.placements?.length || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard",
    });
  }
};

// @desc    Request account extension
// @route   POST /api/student/request-extension
// @access  Private (Student)
export const requestAccountExtension = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason",
      });
    }

    const student = await Student.findOne({ userId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check for pending request
    const hasPending = student.extensionRequests.some(
      (req) => req.status === "pending",
    );

    if (hasPending) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending request",
      });
    }

    // Add request
    student.extensionRequests.push({
      reason: reason.trim(),
      status: "pending",
    });

    await student.save();

    // ✅ FIX: CREATE NOTIFICATIONS FOR ALL ADMINS
    try {
      // Import at the top if not already imported
      const { createNotification, notificationTemplates } =
        await import("../services/notificationService.js");

      // Find all admin users
      const admins = await User.find({ role: "admin", isActive: true }).select(
        "_id",
      );

      console.log(`📧 Creating notifications for ${admins.length} admins`);

      // Create notification for each admin
      for (const admin of admins) {
        await createNotification(
          {
            userId: admin._id,
            userRole: "admin",
            type: "extension_request",
            title: "📝 New Extension Request",
            message: `${student.personalInfo?.firstName || "A student"} ${student.personalInfo?.lastName || ""} (${student.registrationNumber}) has requested an account extension.`,
            actionUrl: "/admin/extension-requests",
            metadata: {
              studentId: student._id,
              studentName: `${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`,
              registrationNumber: student.registrationNumber,
              reason: reason.trim(),
            },
          },
          req.app.get("io"),
        );
      }

      console.log(`✅ Created ${admins.length} notifications for admins`);
    } catch (notifError) {
      console.error("❌ Notification creation error:", notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      message: "Extension request submitted successfully",
    });
  } catch (error) {
    console.error("Extension request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit request",
    });
  }
};
export const getApprovedReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({
      approvalStatus: "approved",
      isActive: true,
    })
      .populate("alumniId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      referrals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch referrals",
    });
  }
};
