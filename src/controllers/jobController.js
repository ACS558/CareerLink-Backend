import Job from "../models/Job.js";
import Recruiter from "../models/Recruiter.js";
import Student from "../models/Student.js";
import Admin from "../models/Admin.js"; // ✅ ADD THIS
import {
  createNotification,
  notificationTemplates,
} from "../services/notificationService.js";

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private (Recruiter)
export const createJob = async (req, res) => {
  try {
    const recruiterId = req.user.roleDoc._id;

    const jobData = {
      ...req.body,
      recruiterId,
    };

    const job = await Job.create(jobData);

    // Populate recruiter info
    await job.populate("recruiterId", "companyInfo userId");

    console.log("✅ Job created:", job._id);

    // ✅ NOTIFY ALL ADMINS ABOUT NEW JOB PENDING APPROVAL
    try {
      const io = req.app.get("io");

      // Get all active admins
      const admins = await Admin.find()
        .select("userId personalInfo.name")
        .populate("userId", "_id email");

      // Get company name
      const companyName =
        job.company || job.recruiterId?.companyInfo?.companyName || "Company";

      console.log(
        `📢 Notifying ${admins.length} admins about new job pending approval`,
      );

      // Create notifications for all admins
      const adminNotifications = admins.map((admin) =>
        createNotification(
          {
            userId: admin.userId._id,
            userRole: "admin",
            type: "new_job_pending",
            title: "📝 New Job Pending Approval",
            message: `${companyName} posted a new job: ${job.title}. Review and approve.`,
            priority: "high",
            relatedJob: job._id,
            relatedUser: recruiterId,
            actionUrl: `/admin/jobs/${job._id}`,
          },
          io,
        ),
      );

      await Promise.all(adminNotifications);
      console.log(`✅ Notified ${admins.length} admins about pending job`);
    } catch (notifError) {
      console.error("Admin notification error:", notifError);
      // Don't fail job creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Job posted successfully! Awaiting admin approval.",
      job,
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create job posting",
    });
  }
};

// @desc    Get all jobs posted by logged-in recruiter
// @route   GET /api/jobs/my-jobs
// @access  Private (Recruiter)
export const getMyJobs = async (req, res) => {
  try {
    const recruiterId = req.user.roleDoc._id;
    const { approvalStatus } = req.query;

    const filter = { recruiterId };
    if (approvalStatus) {
      filter.approvalStatus = approvalStatus;
    }

    const jobs = await Job.find(filter)
      .populate("recruiterId", "companyInfo")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Get my jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Private
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("recruiterId", "companyInfo contactPerson userId")
      .populate({
        path: "recruiterId",
        populate: {
          path: "userId",
          select: "email",
        },
      })
      .populate("approvedBy", "name email");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Get job by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job",
    });
  }
};

// @desc    Update job posting
// @route   PUT /api/jobs/:id
// @access  Private (Recruiter - own jobs only)
export const updateJob = async (req, res) => {
  try {
    const recruiterId = req.user.roleDoc._id;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check ownership
    if (job.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this job",
      });
    }

    // Don't allow editing if already approved
    if (job.approvalStatus === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit approved jobs. Please contact admin.",
      });
    }

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, approvalStatus: "pending" },
      { new: true, runValidators: true },
    ).populate("recruiterId", "companyInfo");

    res.json({
      success: true,
      message: "Job updated successfully! Awaiting admin approval.",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update job",
    });
  }
};

// @desc    Delete job posting
// @route   DELETE /api/jobs/:id
// @access  Private (Recruiter - own jobs only)
export const deleteJob = async (req, res) => {
  try {
    const recruiterId = req.user.roleDoc._id;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check ownership
    if (job.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this job",
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete job",
    });
  }
};

// @desc    Get all approved jobs (for students)
// @route   GET /api/jobs
// @access  Private (Student)
export const getAllApprovedJobs = async (req, res) => {
  try {
    const { search, jobType, location, workMode, minSalary } = req.query;

    const filter = {
      approvalStatus: "approved",
      isActive: true,
    };

    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }];
    }

    if (jobType) filter.jobType = jobType;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (workMode) filter.workMode = workMode;
    if (minSalary) filter["salaryRange.min"] = { $gte: Number(minSalary) };

    const jobs = await Job.find(filter)
      .populate("recruiterId", "companyInfo")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Get all jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

// ==================== ADMIN CONTROLLERS ====================

// @desc    Get all jobs (for admin)
// @route   GET /api/admin/jobs
// @access  Private (Admin)
export const getAllJobsAdmin = async (req, res) => {
  try {
    const { approvalStatus, search } = req.query;

    const filter = {};
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (search) {
      filter.$or = [{ title: { $regex: search, $options: "i" } }];
    }

    const jobs = await Job.find(filter)
      .populate("recruiterId", "companyInfo userId")
      .populate({
        path: "recruiterId",
        populate: { path: "userId", select: "email" },
      })
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Admin get all jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

// @desc    Get pending jobs for approval
// @route   GET /api/admin/jobs/pending
// @access  Private (Admin)
export const getPendingJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ approvalStatus: "pending" })
      .populate("recruiterId", "companyInfo userId")
      .populate({
        path: "recruiterId",
        populate: { path: "userId", select: "email" },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Get pending jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending jobs",
    });
  }
};

// @desc    Approve or reject job
// @route   PUT /api/admin/jobs/:id/verify
// @access  Private (Admin)
export const verifyJob = async (req, res) => {
  try {
    const { action, approvalNotes, rejectionReason } = req.body;
    const adminId = req.user.roleDoc._id;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be approve or reject.",
      });
    }

    if (action === "reject" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const job = await Job.findById(req.params.id)
      .populate("recruiterId")
      .populate({
        path: "recruiterId",
        populate: { path: "userId" },
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.approvalStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Job is already ${job.approvalStatus}`,
      });
    }

    if (action === "approve") {
      job.approvalStatus = "approved";
      job.approvedBy = adminId;
      job.approvedAt = new Date();
      if (approvalNotes) job.approvalNotes = approvalNotes;
    } else {
      job.approvalStatus = "rejected";
      job.rejectionReason = rejectionReason;
      job.isActive = false;
    }

    await job.save();

    const io = req.app.get("io");

    // ✅ 1. NOTIFY RECRUITER (existing code)
    const recruiterUserId = job.recruiterId.userId._id;
    let recruiterNotificationData;
    const actionUrl = `/recruiter/jobs/${job._id}`;

    if (action === "approve") {
      recruiterNotificationData = notificationTemplates.jobApproved(job.title);
    } else {
      recruiterNotificationData = notificationTemplates.jobRejected(
        job.title,
        rejectionReason,
      );
    }

    await createNotification(
      {
        userId: recruiterUserId,
        userRole: "recruiter",
        ...recruiterNotificationData,
        relatedJob: job._id,
        actionUrl,
      },
      io,
    );

    console.log(`✅ Recruiter notified: Job ${action}d`);

    // ✅ 2. NOTIFY ELIGIBLE STUDENTS (only if approved)
    if (action === "approve") {
      try {
        // Build eligibility query
        const eligibilityQuery = {
          accountStatus: "active",
        };

        // Filter by graduation year/batch
        if (job.eligibleBatch) {
          eligibilityQuery["academicInfo.graduationYear"] = job.eligibleBatch;
        }

        // Filter by branches
        if (job.eligibleBranches && job.eligibleBranches.length > 0) {
          eligibilityQuery["academicInfo.branch"] = {
            $in: job.eligibleBranches,
          };
        }

        // Filter by minimum CGPA
        if (job.minCGPA) {
          eligibilityQuery["academicInfo.cgpa"] = { $gte: job.minCGPA };
        }

        // Get eligible students
        const eligibleStudents = await Student.find(eligibilityQuery)
          .select("userId personalInfo registrationNumber")
          .populate("userId", "_id email");

        console.log(
          `📢 Found ${eligibleStudents.length} eligible students for job: ${job.title}`,
        );

        // Get company name
        const companyName =
          job.company || job.recruiterId?.companyInfo?.companyName || "Company";

        // Create notification message
        const packageInfo = job.package ? ` Package: ₹${job.package} LPA.` : "";
        const locationInfo = job.location ? ` Location: ${job.location}.` : "";

        // Send notifications to all eligible students
        const studentNotifications = eligibleStudents.map((student) =>
          createNotification(
            {
              userId: student.userId._id,
              userRole: "student",
              type: "new_job_posted",
              title: "🎯 New Job Opportunity!",
              message: `${companyName} is hiring for ${job.title}.${packageInfo}${locationInfo} Apply now!`,
              priority: "high",
              relatedJob: job._id,
              actionUrl: `/student/jobs/${job._id}`,
            },
            io,
          ),
        );

        await Promise.all(studentNotifications);

        console.log(
          `✅ Successfully notified ${eligibleStudents.length} students about new job`,
        );
      } catch (studentNotifError) {
        console.error("Student notification error:", studentNotifError);
        // Don't fail the approval if student notifications fail
      }
    }

    res.json({
      success: true,
      message: `Job ${action}d successfully${action === "approve" ? " and students notified" : ""}`,
      job,
    });
  } catch (error) {
    console.error("Verify job error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify job",
    });
  }
};
