import Admin from "../models/Admin.js";
import Recruiter from "../models/Recruiter.js";
import Alumni from "../models/Alumni.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { validatePhone } from "../utils/profileHelpers.js";
import {
  createNotification,
  notificationTemplates,
  createBulkNotifications,
} from "../services/notificationService.js";
import ExcelJS from "exceljs";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Referral from "../models/Referral.js";

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin only)
export const getAdminProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const admin = await Admin.findOne({ userId }).populate(
      "userId",
      "email createdAt",
    );

    if (!admin) {
      return res.status(404).json({
        message: "Admin profile not found",
      });
    }

    res.json({
      profile: {
        email: admin.userId.email,
        name: admin.personalInfo.name,
        department: admin.personalInfo.department,
        phoneNumber: admin.personalInfo.phoneNumber,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Admin Profile Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin only)
export const updateAdminProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, department, phoneNumber } = req.body;

    const admin = await Admin.findOne({ userId });

    if (!admin) {
      return res.status(404).json({
        message: "Admin profile not found",
      });
    }

    // Validate phone if provided
    if (phoneNumber && !validatePhone(phoneNumber)) {
      return res.status(400).json({
        message: "Invalid phone number format",
      });
    }

    // Update fields
    if (name) admin.personalInfo.name = name;
    if (department) admin.personalInfo.department = department;
    if (phoneNumber) admin.personalInfo.phoneNumber = phoneNumber;

    await admin.save();

    res.json({
      message: "Profile updated successfully",
      profile: {
        name: admin.personalInfo.name,
        department: admin.personalInfo.department,
        phoneNumber: admin.personalInfo.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Update Admin Profile Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ========== RECRUITER MANAGEMENT ==========

// @desc    Get all recruiters (with optional filters)
// @route   GET /api/admin/recruiters
// @access  Private (Admin only)
export const getAllRecruiters = async (req, res) => {
  try {
    const { verificationStatus, search } = req.query;

    // Build query
    let query = {};

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    if (search) {
      query["companyInfo.companyName"] = { $regex: search, $options: "i" };
    }

    const recruiters = await Recruiter.find(query)
      .populate("userId", "email createdAt isActive")
      .populate("verifiedBy", "personalInfo.name")
      .sort({ createdAt: -1 });

    res.json({
      recruiters: recruiters,
      total: recruiters.length,
    });
  } catch (error) {
    console.error("Get All Recruiters Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get pending recruiters
// @route   GET /api/admin/recruiters/pending
// @access  Private (Admin only)
export const getPendingRecruiters = async (req, res) => {
  try {
    const recruiters = await Recruiter.find({
      verificationStatus: "pending",
    })
      .populate("userId", "email createdAt")
      .sort({ createdAt: -1 });

    res.json({
      recruiters: recruiters,
      total: recruiters.length,
      message:
        recruiters.length === 0
          ? "No pending recruiters"
          : `${recruiters.length} recruiter(s) awaiting verification`,
    });
  } catch (error) {
    console.error("Get Pending Recruiters Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Verify recruiter (approve or reject)
// @route   PUT /api/admin/recruiters/:id/verify
// @access  Private (Admin only)
export const verifyRecruiter = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, verificationNotes, rejectionReason } = req.body;
    const adminId = req.user.userId;

    // Validate action
    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        message: 'Invalid action. Must be "approve" or "reject"',
      });
    }

    // Find recruiter
    const recruiter = await Recruiter.findById(id).populate("userId", "email");

    if (!recruiter) {
      return res.status(404).json({
        message: "Recruiter not found",
      });
    }

    // Check if already verified
    if (recruiter.verificationStatus !== "pending") {
      return res.status(400).json({
        message: `Recruiter is already ${recruiter.verificationStatus}`,
      });
    }

    // Find admin
    const admin = await Admin.findOne({ userId: adminId });

    if (action === "approve") {
      // Approve recruiter
      recruiter.verificationStatus = "approved";
      recruiter.verifiedBy = admin._id;
      recruiter.verifiedAt = new Date();
      recruiter.verificationNotes = verificationNotes || "Approved by admin";
      recruiter.rejectionReason = "";

      // Activate user account
      await User.findByIdAndUpdate(recruiter.userId._id, {
        isActive: true,
        isVerified: true,
      });

      await recruiter.save();

      // CREATE NOTIFICATION - Recruiter Approved
      const notificationData = notificationTemplates.recruiterApproved();
      await createNotification(
        {
          userId: recruiter.userId._id,
          userRole: "recruiter",
          ...notificationData,
          actionUrl: "/recruiter/dashboard",
        },
        req.app.get("io"),
      );

      res.json({
        message: `${recruiter.companyInfo.companyName} has been approved successfully`,
        recruiter: {
          id: recruiter._id,
          companyName: recruiter.companyInfo.companyName,
          email: recruiter.userId.email,
          verificationStatus: "approved",
          verifiedBy: admin.personalInfo.name,
          verifiedAt: recruiter.verifiedAt,
        },
      });
    } else if (action === "reject") {
      // Reject recruiter
      if (!rejectionReason) {
        return res.status(400).json({
          message: "Rejection reason is required",
        });
      }

      recruiter.verificationStatus = "rejected";
      recruiter.rejectionReason = rejectionReason;
      recruiter.verifiedBy = admin._id;
      recruiter.verifiedAt = new Date();

      // Keep user account inactive
      await User.findByIdAndUpdate(recruiter.userId._id, {
        isActive: false,
      });

      await recruiter.save();

      // CREATE NOTIFICATION - Recruiter Rejected
      const notificationData =
        notificationTemplates.recruiterRejected(rejectionReason);
      await createNotification(
        {
          userId: recruiter.userId._id,
          userRole: "recruiter",
          ...notificationData,
          actionUrl: "/recruiter/dashboard",
        },
        req.app.get("io"),
      );

      res.json({
        message: `${recruiter.companyInfo.companyName} has been rejected`,
        recruiter: {
          id: recruiter._id,
          companyName: recruiter.companyInfo.companyName,
          email: recruiter.userId.email,
          verificationStatus: "rejected",
          rejectionReason: rejectionReason,
        },
      });
    }
  } catch (error) {
    console.error("Verify Recruiter Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ========== ALUMNI MANAGEMENT ==========

// @desc    Get all alumni (with optional filters)
// @route   GET /api/admin/alumni
// @access  Private (Admin only)
export const getAllAlumni = async (req, res) => {
  try {
    const { verificationStatus, search, branch, graduationYear } = req.query;

    // Build query
    let query = {};

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    if (search) {
      query.$or = [
        { "personalInfo.firstName": { $regex: search, $options: "i" } },
        { "personalInfo.lastName": { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (branch) {
      query["academicInfo.branch"] = branch;
    }

    if (graduationYear) {
      query["academicInfo.graduationYear"] = parseInt(graduationYear);
    }

    const alumni = await Alumni.find(query)
      .populate("userId", "email createdAt isActive")
      .populate("verifiedBy", "personalInfo.name")
      .sort({ createdAt: -1 });

    res.json({
      alumni: alumni,
      total: alumni.length,
    });
  } catch (error) {
    console.error("Get All Alumni Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get pending alumni
// @route   GET /api/admin/alumni/pending
// @access  Private (Admin only)
export const getPendingAlumni = async (req, res) => {
  try {
    const alumni = await Alumni.find({
      verificationStatus: "pending",
    })
      .populate("userId", "email createdAt")
      .sort({ createdAt: -1 });

    res.json({
      alumni: alumni,
      total: alumni.length,
      message:
        alumni.length === 0
          ? "No pending alumni"
          : `${alumni.length} alumni awaiting verification`,
    });
  } catch (error) {
    console.error("Get Pending Alumni Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Verify alumni (approve or reject)
// @route   PUT /api/admin/alumni/:id/verify
// @access  Private (Admin only)
export const verifyAlumni = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, verificationNotes, rejectionReason } = req.body;
    const adminId = req.user.userId;

    // Validate action
    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        message: 'Invalid action. Must be "approve" or "reject"',
      });
    }

    // Find alumni
    const alumni = await Alumni.findById(id).populate("userId", "email");

    if (!alumni) {
      return res.status(404).json({
        message: "Alumni not found",
      });
    }

    // Check if already verified
    if (alumni.verificationStatus !== "pending") {
      return res.status(400).json({
        message: `Alumni is already ${alumni.verificationStatus}`,
      });
    }

    // Find admin
    const admin = await Admin.findOne({ userId: adminId });

    if (action === "approve") {
      // Approve alumni
      alumni.verificationStatus = "approved";
      alumni.verifiedBy = admin._id;
      alumni.verifiedAt = new Date();
      alumni.verificationNotes = verificationNotes || "Approved by admin";
      alumni.rejectionReason = "";

      // Activate user account
      await User.findByIdAndUpdate(alumni.userId._id, {
        isActive: true,
        isVerified: true,
      });

      await alumni.save();

      // CREATE NOTIFICATION - Alumni Approved
      const notificationData = notificationTemplates.alumniApproved();
      await createNotification(
        {
          userId: alumni.userId._id,
          userRole: "alumni",
          ...notificationData,
          actionUrl: "/alumni/dashboard",
        },
        req.app.get("io"),
      );

      res.json({
        message: `${alumni.personalInfo.firstName} ${alumni.personalInfo.lastName} has been approved successfully`,
        alumni: {
          id: alumni._id,
          name: `${alumni.personalInfo.firstName} ${alumni.personalInfo.lastName}`,
          email: alumni.userId.email,
          verificationStatus: "approved",
          verifiedBy: admin.personalInfo.name,
          verifiedAt: alumni.verifiedAt,
        },
      });
    } else if (action === "reject") {
      // Reject alumni
      if (!rejectionReason) {
        return res.status(400).json({
          message: "Rejection reason is required",
        });
      }

      alumni.verificationStatus = "rejected";
      alumni.rejectionReason = rejectionReason;
      alumni.verifiedBy = admin._id;
      alumni.verifiedAt = new Date();

      // Keep user account inactive
      await User.findByIdAndUpdate(alumni.userId._id, {
        isActive: false,
      });

      await alumni.save();

      // CREATE NOTIFICATION - Alumni Rejected
      const notificationData =
        notificationTemplates.alumniRejected(rejectionReason);
      await createNotification(
        {
          userId: alumni.userId._id,
          userRole: "alumni",
          ...notificationData,
          actionUrl: "/alumni/dashboard",
        },
        req.app.get("io"),
      );

      res.json({
        message: `${alumni.personalInfo.firstName} ${alumni.personalInfo.lastName} has been rejected`,
        alumni: {
          id: alumni._id,
          name: `${alumni.personalInfo.firstName} ${alumni.personalInfo.lastName}`,
          email: alumni.userId.email,
          verificationStatus: "rejected",
          rejectionReason: rejectionReason,
        },
      });
    }
  } catch (error) {
    console.error("Verify Alumni Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ========== DASHBOARD STATISTICS ==========

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
export const getDashboardStats = async (req, res) => {
  try {
    // Count students
    const totalStudents = await Student.countDocuments();
    const placedStudents = await Student.countDocuments({
      placementStatus: "placed",
    });
    const unplacedStudents = await Student.countDocuments({
      placementStatus: "unplaced",
    });

    // Count recruiters
    const totalRecruiters = await Recruiter.countDocuments();
    const pendingRecruiters = await Recruiter.countDocuments({
      verificationStatus: "pending",
    });
    const approvedRecruiters = await Recruiter.countDocuments({
      verificationStatus: "approved",
    });
    const rejectedRecruiters = await Recruiter.countDocuments({
      verificationStatus: "rejected",
    });

    // Count alumni
    const totalAlumni = await Alumni.countDocuments();
    const pendingAlumni = await Alumni.countDocuments({
      verificationStatus: "pending",
    });
    const verifiedAlumni = await Alumni.countDocuments({
      verificationStatus: "verified",
    });
    const rejectedAlumni = await Alumni.countDocuments({
      verificationStatus: "rejected",
    });

    // Calculate placement percentage
    const placementPercentage =
      totalStudents > 0
        ? ((placedStudents / totalStudents) * 100).toFixed(2)
        : 0;

    // Get package statistics (if any students are placed)
    let packageStats = {
      average: 0,
      highest: 0,
      lowest: 0,
    };

    if (placedStudents > 0) {
      const placedStudentsData = await Student.find({
        placementStatus: "placed",
        package: { $exists: true, $ne: null },
      }).select("package");

      const packages = placedStudentsData
        .map((s) => s.package)
        .filter((p) => p !== null && p !== undefined);

      if (packages.length > 0) {
        packageStats.average = (
          packages.reduce((a, b) => a + b, 0) / packages.length
        ).toFixed(2);
        packageStats.highest = Math.max(...packages);
        packageStats.lowest = Math.min(...packages);
      }
    }

    res.json({
      statistics: {
        students: {
          total: totalStudents,
          placed: placedStudents,
          unplaced: unplacedStudents,
          placementPercentage: parseFloat(placementPercentage),
        },
        recruiters: {
          total: totalRecruiters,
          pending: pendingRecruiters,
          approved: approvedRecruiters,
          rejected: rejectedRecruiters,
        },
        alumni: {
          total: totalAlumni,
          pending: pendingAlumni,
          verified: verifiedAlumni,
          rejected: rejectedAlumni,
        },
        packages: packageStats,
        pendingActions: {
          recruitersAwaitingVerification: pendingRecruiters,
          alumniAwaitingVerification: pendingAlumni,
          total: pendingRecruiters + pendingAlumni,
        },
      },
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Get all students (for admin view)
// @route   GET /api/admin/students
// @access  Private (Admin only)
export const getAllStudents = async (req, res) => {
  try {
    const {
      search,
      branch,
      placementStatus,
      graduationYear,
      page = 1,
      limit = 20,
    } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { "personalInfo.firstName": { $regex: search, $options: "i" } },
        { "personalInfo.lastName": { $regex: search, $options: "i" } },
        { registrationNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (branch) {
      query["academicInfo.branch"] = branch;
    }

    if (placementStatus) {
      query.placementStatus = placementStatus;
    }

    if (graduationYear) {
      query["academicInfo.graduationYear"] = parseInt(graduationYear);
    }

    // Execute query with pagination
    const students = await Student.find(query)
      .populate("userId", "email isActive")
      .sort({ "academicInfo.cgpa": -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Student.countDocuments(query);

    res.json({
      students: students,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalStudents: count,
    });
  } catch (error) {
    console.error("Get All Students Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ========== EXTENSION REQUEST MANAGEMENT ==========

// @desc    Get all extension requests
// @route   GET /api/admin/extension-requests
// @access  Private (Admin only)
export const getExtensionRequests = async (req, res) => {
  try {
    const { status } = req.query; // pending, approved, rejected

    const filter = {};
    if (status) {
      filter["extensionRequests.status"] = status;
    }

    const students = await Student.find(filter)
      .populate("userId", "email")
      .select(
        "registrationNumber personalInfo extensionRequests accountStatus expiryDate",
      )
      .lean();

    // Flatten extension requests
    const requests = [];
    students.forEach((student) => {
      if (student.extensionRequests && student.extensionRequests.length > 0) {
        student.extensionRequests.forEach((request) => {
          if (!status || request.status === status) {
            requests.push({
              _id: request._id,
              studentId: student._id,
              registrationNumber: student.registrationNumber,
              name: `${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`,
              email: student.userId?.email,
              reason: request.reason,
              status: request.status,
              requestedAt: request.requestedAt,
              reviewedAt: request.reviewedAt,
              accountStatus: student.accountStatus,
              expiryDate: student.expiryDate,
            });
          }
        });
      }
    });

    // Sort by date (newest first)
    requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get extension requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch extension requests",
    });
  }
};

// @desc    Review extension request (approve/reject)
// @route   POST /api/admin/extension-requests/:studentId/:requestId/review
// @access  Private (Admin only)
export const reviewExtensionRequest = async (req, res) => {
  try {
    const { studentId, requestId } = req.params;
    const { action, extensionDays } = req.body; // action: 'approve' or 'reject'
    const adminId = req.user.userId;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use approve or reject",
      });
    }

    const student = await Student.findById(studentId).populate(
      "userId",
      "email",
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Find the specific request
    const request = student.extensionRequests.id(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Extension request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request has already been reviewed",
      });
    }

    // Update request status
    request.status = action === "approve" ? "approved" : "rejected";
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();

    // If approved, extend expiry date
    if (action === "approve") {
      const daysToAdd = extensionDays || 30; // Default 30 days
      const currentExpiry = new Date(student.expiryDate);
      currentExpiry.setDate(currentExpiry.getDate() + daysToAdd);
      student.expiryDate = currentExpiry;

      // Also update deletion date
      const newDeletion = new Date(currentExpiry);
      newDeletion.setDate(newDeletion.getDate() + 90);
      student.deletionScheduledAt = newDeletion;

      // If account was expired, reactivate it
      if (student.accountStatus === "expired") {
        student.accountStatus = "active";
      }
    }

    await student.save();

    // ✅ CREATE NOTIFICATION FOR STUDENT
    const notificationData =
      action === "approve"
        ? notificationTemplates.extensionApproved(extensionDays)
        : notificationTemplates.extensionRejected();

    await createNotification(
      {
        userId: student.userId._id,
        userRole: "student",
        ...notificationData,
        actionUrl: "/student/dashboard",
      },
      req.app.get("io"),
    );

    // ✅ Log for admin notification (will be handled by frontend polling)
    console.log(
      `Extension request ${action}ed for student ${student.registrationNumber}`,
    );

    res.json({
      success: true,
      message: `Request ${action}ed successfully`,
      student: {
        name: `${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`,
        expiryDate: student.expiryDate,
        accountStatus: student.accountStatus,
      },
    });
  } catch (error) {
    console.error("Review extension request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to review request",
    });
  }
};

// @desc    Get extension request statistics
// @route   GET /api/admin/extension-requests/stats
// @access  Private (Admin only)
export const getExtensionStats = async (req, res) => {
  try {
    const students = await Student.find({
      extensionRequests: { $exists: true, $ne: [] },
    }).select("extensionRequests");

    let pending = 0,
      approved = 0,
      rejected = 0;

    students.forEach((student) => {
      student.extensionRequests.forEach((req) => {
        if (req.status === "pending") pending++;
        else if (req.status === "approved") approved++;
        else if (req.status === "rejected") rejected++;
      });
    });

    res.json({
      success: true,
      stats: {
        total: pending + approved + rejected,
        pending,
        approved,
        rejected,
      },
    });
  } catch (error) {
    console.error("Extension stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
  }
};

// @desc    Get single job with applications (admin)
// @route   GET /api/admin/jobs/:jobId
// @access  Private (Admin)
export const getAdminJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId).populate(
      "recruiterId",
      "companyInfo contactPerson",
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Get all applications for this job
    const applications = await Application.find({ jobId })
      .populate({
        path: "studentId",
        select: "personalInfo academicInfo registrationNumber",
      })
      .sort({ createdAt: -1 });

    // Get stats
    const stats = {
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      shortlisted: applications.filter((a) => a.status === "shortlisted")
        .length,
      selected: applications.filter((a) => a.status === "selected").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    };

    res.json({
      success: true,
      job,
      applications,
      stats,
    });
  } catch (error) {
    console.error("Get admin job details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job details",
    });
  }
};

// @desc    Update application status (admin)
// @route   PUT /api/admin/applications/:id/status
// @access  Private (Admin)
export const adminUpdateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "shortlisted", "selected", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const application = await Application.findById(id)
      .populate({
        path: "jobId",
        populate: { path: "recruiterId", select: "companyInfo" },
      })
      .populate({
        path: "studentId",
        select:
          "userId personalInfo registrationNumber placements placementStatus",
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const oldStatus = application.status;
    application.status = status;

    if (status === "shortlisted") {
      application.shortlistedAt = new Date();
    } else if (status === "selected") {
      application.selectedAt = new Date();
    } else if (status === "rejected") {
      application.rejectedAt = new Date();
    }

    await application.save();

    // ✅ AUTO-CREATE PLACEMENT - ONLY FOR SELECTED STATUS
    if (status === "selected" && oldStatus !== "selected") {
      try {
        const student = await Student.findById(application.studentId._id);

        if (student) {
          const job = application.jobId;
          const companyName =
            job.company ||
            job.recruiterId?.companyInfo?.companyName ||
            "Company";
          const jobTitle = job.title || "";
          const packageAmount =
            job.package || job.salary || job.salaryRange?.max || 0;

          // ✅ ONLY CHECK BY APPLICATION ID
          const existingPlacement = student.placements?.find(
            (p) =>
              p.metadata?.applicationId?.toString() ===
              application._id.toString(),
          );

          if (existingPlacement) {
            console.log(
              `ℹ️ Placement already exists for application ${application._id}`,
            );
          } else {
            // ✅ CREATE NEW PLACEMENT
            console.log(
              `🎯 Admin creating placement for ${student.registrationNumber} at ${companyName}`,
            );

            await Student.updateOne(
              { _id: student._id },
              {
                $push: {
                  placements: {
                    company: companyName,
                    jobTitle: jobTitle,
                    package: packageAmount,
                    offerDate: new Date(),
                    isPrimary: student.placements.length === 0,
                    metadata: {
                      jobId: job._id,
                      applicationId: application._id,
                    },
                  },
                },
                $set: {
                  placementStatus: "placed",
                  placedCompany: companyName,
                  package: packageAmount,
                  placedAt: new Date(),
                },
              },
            );

            console.log(
              `✅ Admin: ${student.registrationNumber} marked as PLACED`,
            );

            // ✅ Send placement notification
            await createNotification(
              {
                userId: application.studentId.userId,
                userRole: "student",
                ...notificationTemplates.placementOffer(jobTitle, companyName),
                actionUrl: "/student/placements",
                relatedJob: job._id,
                relatedApplication: application._id,
              },
              req.app.get("io"),
            );
          }
        }
      } catch (error) {
        console.error("Admin placement creation error:", error);
      }
    }

    // ✅ SEND STATUS CHANGE NOTIFICATION
    const jobTitle = application.jobId.title;
    const companyName =
      application.jobId.recruiterId?.companyInfo?.companyName || "Company";

    let notificationData;
    let actionUrl = "/student/applications";

    switch (status) {
      case "pending":
        notificationData = notificationTemplates.applicationPending(
          jobTitle,
          companyName,
        );
        break;

      case "shortlisted":
        notificationData = notificationTemplates.applicationShortlisted(
          jobTitle,
          companyName,
        );
        break;

      case "selected":
        notificationData = notificationTemplates.applicationSelected(
          jobTitle,
          companyName,
        );
        actionUrl = `/student/jobs/${application.jobId._id}`;
        break;

      case "rejected":
        notificationData = notificationTemplates.applicationRejected(
          jobTitle,
          companyName,
        );
        break;
    }

    if (notificationData) {
      await createNotification(
        {
          userId: application.studentId.userId,
          userRole: "student",
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          priority: notificationData.priority || "high",
          relatedJob: application.jobId._id,
          relatedApplication: application._id,
          actionUrl,
        },
        req.app.get("io"),
      );

      console.log(`✅ Admin notification sent: ${oldStatus} → ${status}`);
    }

    res.json({
      success: true,
      message: "Application status updated",
      application,
    });
  } catch (error) {
    console.error("Admin update application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update application",
    });
  }
};

// @desc    Export applications to Excel (SIMPLIFIED COLUMNS)
// @route   GET /api/admin/jobs/:jobId/export
// @access  Private (Admin)
export const exportJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, branch, company } = req.query; // 'selected' or 'all'

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Build filter
    const filter = { jobId };
    if (status && status !== "all") {
      filter.status = status;
    }

    // ✅ NEW: Branch filter
    if (branch && branch !== "all") {
      const studentsInBranch = await Student.find({
        "academicInfo.branch": branch,
      }).select("_id");

      filter.studentId = { $in: studentsInBranch.map((s) => s._id) };
    }

    const applications = await Application.find(filter)
      .populate({
        path: "studentId",
        select: "personalInfo academicInfo registrationNumber",
      })
      .sort({ createdAt: -1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Applications");

    // ✅ SIMPLIFIED COLUMNS - Only 5 columns as requested
    worksheet.columns = [
      { header: "Registration No", key: "regNo", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Branch", key: "branch", width: 10 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Email", key: "email", width: 30 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    worksheet.getRow(1).height = 25;

    // Add data rows
    applications.forEach((app) => {
      const student = app.studentId;

      worksheet.addRow({
        regNo: student.registrationNumber || "N/A",
        name:
          `${student.personalInfo?.firstName || ""} ${student.personalInfo?.lastName || ""}`.trim() ||
          "N/A",
        branch: student.academicInfo?.branch || "N/A",
        phone: student.personalInfo?.phoneNumber || "N/A",
        email: student.personalInfo?.email || "N/A",
      });
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Set response headers
    const statusText = status === "selected" ? "selected" : "all";
    const filename = `${job.title.replace(/[^a-z0-9]/gi, "_")}_${statusText}_applications.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export applications",
    });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { email, password, name, department } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      email,
      password,
      role: "admin",
      isVerified: true,
      isActive: true,
    });

    const admin = await Admin.create({
      userId: user._id,
      roleLevel: "admin",
      personalInfo: {
        name,
        department,
      },
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create admin",
    });
  }
};

export const getAllAdmins = async (req, res) => {
  const admins = await Admin.find().populate("userId", "email");

  res.json({
    success: true,
    admins,
  });
};

export const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  const admin = await Admin.findById(id);

  if (!admin) {
    return res.status(404).json({
      message: "Admin not found",
    });
  }

  if (admin.roleLevel === "super_admin") {
    const count = await Admin.countDocuments({
      roleLevel: "super_admin",
    });

    if (count <= 1) {
      return res.status(400).json({
        message: "Cannot delete last Super Admin",
      });
    }
  }

  await User.findByIdAndDelete(admin.userId);
  await Admin.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Admin deleted successfully",
  });
};

export const getPendingReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ approvalStatus: "pending" })
      .populate("alumniId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      referrals,
    });
  } catch (error) {
    console.error("Get pending referrals error:", error); // ADD THIS

    res.status(500).json({
      success: false,
      message: "Failed to fetch pending referrals",
    });
  }
};
export const getAllReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate("alumniId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      referrals,
    });
  } catch (error) {
    console.error("Get referrals error:", error); // ADD THIS

    res.status(500).json({
      success: false,
      message: "Failed to fetch referrals",
    });
  }
};
export const verifyReferral = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;

    const referral = await Referral.findById(req.params.id).populate({
      path: "alumniId",
      populate: { path: "userId" },
    });

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found",
      });
    }

    const adminId = req.user.roleDoc._id;

    if (action === "approve") {
      referral.approvalStatus = "approved";
      referral.approvedBy = adminId;
      referral.approvedAt = new Date();
    } else {
      referral.approvalStatus = "rejected";
      referral.rejectionReason = rejectionReason;
      referral.isActive = false;
    }

    await referral.save();

    const io = req.app.get("io");

    const alumniUserId = referral.alumniId.userId._id;

    // ✅ Notify alumni
    await createNotification(
      {
        userId: alumniUserId,
        userRole: "alumni",
        type: action === "approve" ? "referral_approved" : "referral_rejected",
        title:
          action === "approve"
            ? "Referral Approved 🎉"
            : "Referral Rejected ❌",
        message:
          action === "approve"
            ? `${referral.company} referral approved`
            : `${referral.company} referral rejected`,
      },
      io,
    );

    // ✅ Notify students if approved
    if (action === "approve") {
      const students = await Student.find({ accountStatus: "active" }).select(
        "userId",
      );

      const studentNotifications = students.map((student) => ({
        userId: student.userId,
        userRole: "student",
        type: "new_referral_posted",
        title: "🎯 New Referral Opportunity",
        message: `${referral.company} is hiring for ${referral.role}`,
        actionUrl: `/student/referrals/${referral._id}`,
        priority: "high",
      }));

      await createBulkNotifications(studentNotifications, io);
    }

    res.json({
      success: true,
      message: `Referral ${action}d successfully`,
      referral,
    });
  } catch (error) {
    console.error("Verify referral error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to verify referral",
    });
  }
};
