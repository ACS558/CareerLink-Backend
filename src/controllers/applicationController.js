import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Student from "../models/Student.js";
import { calculateATSScoreFromResume } from "../services/geminiService.js";
import {
  createNotification,
  notificationTemplates,
} from "../services/notificationService.js";

// ==================== STUDENT CONTROLLERS ====================

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private (Student)
export const applyForJob = async (req, res) => {
  try {
    const studentId = req.user?.roleDoc?._id;
    const { jobId, coverLetter } = req.body;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message:
          "Student profile not found. Please complete your profile first.",
      });
    }
    // Check if job exists and is approved
    const job = await Job.findById(jobId).populate("recruiterId");
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.approvalStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: "This job is not available for applications",
      });
    }

    if (!job.isActive) {
      return res.status(400).json({
        success: false,
        message: "This job posting is no longer active",
      });
    }

    // Check application deadline
    if (
      job.applicationDeadline &&
      new Date(job.applicationDeadline) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Application deadline has passed",
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({ jobId, studentId });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Get student profile for eligibility check
    const student = await Student.findById(studentId);

    // Check eligibility criteria
    const eligibility = job.eligibilityCriteria;

    // Check CGPA
    if (
      eligibility.minCGPA &&
      student.academicInfo?.cgpa < eligibility.minCGPA
    ) {
      return res.status(400).json({
        success: false,
        message: `Minimum CGPA required: ${eligibility.minCGPA}. Your CGPA: ${student.academicInfo?.cgpa || "Not set"}`,
      });
    }

    // Check backlogs
    if (
      eligibility.maxBacklogs !== undefined &&
      student.academicInfo?.backlogs > eligibility.maxBacklogs
    ) {
      return res.status(400).json({
        success: false,
        message: `Maximum backlogs allowed: ${eligibility.maxBacklogs}. Your backlogs: ${student.academicInfo?.backlogs}`,
      });
    }

    // Check branch
    if (
      eligibility.branches?.length > 0 &&
      !eligibility.branches.includes(student.academicInfo?.branch)
    ) {
      return res.status(400).json({
        success: false,
        message: `This job is only for branches: ${eligibility.branches.join(", ")}. Your branch: ${student.academicInfo?.branch}`,
      });
    }

    // Check graduation year
    if (
      eligibility.graduationYears?.length > 0 &&
      !eligibility.graduationYears.includes(
        student.academicInfo?.graduationYear,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `This job is only for graduation years: ${eligibility.graduationYears.join(", ")}. Your year: ${student.academicInfo?.graduationYear}`,
      });
    }

    // Calculate ATS Score - PRIORITIZE RESUME if available
    let atsScoreData = null;
    try {
      console.log("\n🎯 === ATS CALCULATION START ===");

      // Check if student has uploaded resume with parsed data
      if (student.resume?.parsedData) {
        console.log(
          "📄 Student has parsed resume data - using resume-based ATS scoring",
        );

        // Convert parsed data to text for ATS analysis
        const resumeText = `
PERSONAL INFO:
Name: ${student.resume.parsedData.personalInfo?.name || "N/A"}
Email: ${student.resume.parsedData.personalInfo?.email || "N/A"}
Phone: ${student.resume.parsedData.personalInfo?.phone || "N/A"}

SKILLS:
${student.resume.parsedData.skills?.join(", ") || "None listed"}

EDUCATION:
${
  student.resume.parsedData.education
    ?.map(
      (edu) =>
        `${edu.degree} from ${edu.institution} (${edu.year}) - CGPA: ${edu.cgpa || "N/A"}`,
    )
    .join("\n") || "None listed"
}

EXPERIENCE:
${
  student.resume.parsedData.experience
    ?.map(
      (exp) =>
        `${exp.title} at ${exp.company} (${exp.duration})\n${exp.description}`,
    )
    .join("\n\n") || "None listed"
}

PROJECTS:
${
  student.resume.parsedData.projects
    ?.map(
      (proj) =>
        `${proj.title}: ${proj.description}\nTechnologies: ${proj.technologies?.join(", ") || "N/A"}`,
    )
    .join("\n\n") || "None listed"
}

CERTIFICATIONS:
${
  student.resume.parsedData.certifications
    ?.map((cert) => `${cert.name} by ${cert.issuer}`)
    .join("\n") || "None listed"
}
    `.trim();

        console.log("📝 Resume text prepared (first 300 chars):");
        console.log(resumeText.substring(0, 300) + "...\n");

        // Try resume-based scoring
        atsScoreData = await calculateATSScoreFromResume(resumeText, job);

        if (atsScoreData) {
          console.log(
            "✅ Resume-based ATS score calculated:",
            atsScoreData.score,
          );
        }
      } else {
        console.log("ℹ️ No resume data available");
      }

      // Fallback to profile-based scoring if resume scoring failed
      if (!atsScoreData) {
        console.log("📊 Using profile-based ATS scoring (fallback)");
        console.log("Student profile:", {
          skills: student.skills?.length || 0,
          projects: student.projects?.length || 0,
          cgpa: student.academicInfo?.cgpa,
        });

        atsScoreData = await calculateATSScore(student, job);
        console.log(
          "✅ Profile-based ATS score calculated:",
          atsScoreData.score,
        );
      }

      console.log("\n📊 Final ATS Result:");
      console.log(JSON.stringify(atsScoreData, null, 2));
      console.log("🎯 === ATS CALCULATION END ===\n");
    } catch (error) {
      console.error("ATS calculation error:", error);
      // Continue even if ATS fails
    }

    // Create application
    const application = await Application.create({
      jobId,
      studentId,
      recruiterId: job.recruiterId._id,
      coverLetter,
      appliedAt: new Date(),
      atsScore: atsScoreData
        ? {
            score: atsScoreData.score,
            strengths: atsScoreData.strengths,
            weaknesses: atsScoreData.weaknesses,
            recommendation: atsScoreData.recommendation,
            calculatedAt: new Date(),
          }
        : undefined,
    });

    // Populate for response
    await application.populate([
      { path: "jobId", select: "title location jobType workMode salaryRange" },
      { path: "studentId", select: "personalInfo academicInfo" },
    ]);

    res.status(201).json({
      success: true,
      message: "Application submitted successfully!",
      application,
      atsScore: atsScoreData,
    });
  } catch (error) {
    console.error("Apply for job error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit application",
    });
  }
};

// @desc    Get student's applications
// @route   GET /api/applications/my-applications
// @access  Private (Student)
export const getMyApplications = async (req, res) => {
  try {
    const studentId = req.user.roleDoc._id;
    const { status } = req.query;

    const filter = { studentId };
    if (status) {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate({
        path: "jobId",
        select:
          "title location jobType workMode salaryRange applicationDeadline",
        populate: {
          path: "recruiterId",
          select: "companyInfo",
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get my applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

// @desc    Get single application details
// @route   GET /api/applications/:id
// @access  Private (Student)
export const getApplicationById = async (req, res) => {
  try {
    const studentId = req.user.roleDoc._id;

    const application = await Application.findById(req.params.id)
      .populate({
        path: "jobId",
        populate: {
          path: "recruiterId",
          select: "companyInfo contactPerson",
        },
      })
      .populate("studentId", "personalInfo academicInfo skills");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check ownership
    if (application.studentId._id.toString() !== studentId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this application",
      });
    }

    res.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Get application by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
    });
  }
};

// @desc    Withdraw application
// @route   DELETE /api/applications/:id
// @access  Private (Student)
export const withdrawApplication = async (req, res) => {
  try {
    const studentId = req.user.roleDoc._id;

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check ownership
    if (application.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to withdraw this application",
      });
    }

    // Can't withdraw if already shortlisted or selected
    if (["shortlisted", "selected"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw application that is ${application.status}`,
      });
    }

    await Application.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    console.error("Withdraw application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to withdraw application",
    });
  }
};

// ==================== RECRUITER CONTROLLERS ====================

// @desc    Get applications for recruiter's jobs
// @route   GET /api/applications/recruiter/all
// @access  Private (Recruiter)
export const getRecruiterApplications = async (req, res) => {
  try {
    const recruiterId = req.user.roleDoc._id;
    const { jobId, status } = req.query;

    const filter = { recruiterId };
    if (jobId) filter.jobId = jobId;
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate({
        path: "studentId",
        select: "personalInfo academicInfo skills registrationNumber resume",
      })
      .populate({
        path: "jobId",
        select: "title location jobType",
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Get recruiter applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

// @desc    Get applications for a specific job
// @route   GET /api/applications/job/:jobId
// @access  Private (Recruiter)
export const getJobApplications = async (req, res) => {
  try {
    const recruiterId = req.user.roleDoc._id;
    const { jobId } = req.params;
    const { status } = req.query;

    // Verify job belongs to recruiter
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view applications for this job",
      });
    }

    const filter = { jobId };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate({
        path: "studentId",
        select:
          "personalInfo academicInfo skills projects internships certifications registrationNumber resume",
      })
      .sort({ createdAt: -1 });

    // Get stats
    const stats = {
      total: applications.length,
      applied: applications.filter((a) => a.status === "applied").length,
      shortlisted: applications.filter((a) => a.status === "shortlisted")
        .length,
      rejected: applications.filter((a) => a.status === "rejected").length,
      selected: applications.filter((a) => a.status === "selected").length,
    };

    res.json({
      success: true,
      stats,
      applications,
    });
  } catch (error) {
    console.error("Get job applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

// @desc    Update application status (shortlist/reject/select)
// @route   PUT /api/applications/:id/status
// @access  Private (Recruiter)
export const updateApplicationStatus = async (req, res) => {
  try {
    const recruiterId = req.user.roleDoc._id;
    const { status } = req.body;

    // Validate status
    if (!["shortlisted", "rejected", "selected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const application = await Application.findById(req.params.id)
      .populate({
        path: "jobId",
        populate: {
          path: "recruiterId",
          select: "companyInfo",
        },
      })
      .populate({
        path: "studentId",
        select:
          "userId personalInfo academicInfo registrationNumber placements placementStatus",
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if job belongs to recruiter
    if (
      application.jobId.recruiterId._id.toString() !== recruiterId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this application",
      });
    }

    // Store old status
    const oldStatus = application.status;

    // Update application status
    application.status = status;

    if (status === "shortlisted") {
      application.shortlistedAt = new Date();
      application.shortlistedBy = req.user.userId;
    } else if (status === "rejected") {
      application.rejectedAt = new Date();
    } else if (status === "selected") {
      application.selectedAt = new Date();
    }

    await application.save();

    // ✅ AUTO-CREATE PLACEMENT - ONLY CHECK BY APPLICATION ID
    if (status === "selected" && oldStatus !== "selected") {
      try {
        const student = await Student.findById(application.studentId._id);

        if (!student) {
          console.error("❌ Student not found:", application.studentId._id);
          throw new Error("Student not found");
        }

        const job = application.jobId;
        const companyName =
          job.company || job.recruiterId?.companyInfo?.companyName || "Company";
        const jobTitle = job.title || job.role || "";
        const packageAmount =
          job.package || job.salary || job.salaryRange?.max || 0;

        // ✅ ONLY CHECK BY APPLICATION ID (allow multiple placements from same company)
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
            `🎯 Creating placement for student ${student.registrationNumber}`,
          );
          console.log(
            `Company: ${companyName}, Role: ${jobTitle}, Package: ${packageAmount}`,
          );

          const updateResult = await Student.updateOne(
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

          console.log("✅ Update result:", updateResult);
          console.log(
            `✅ Student ${student.registrationNumber} marked as PLACED`,
          );

          // ✅ Send placement notification
          try {
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
          } catch (notifError) {
            console.error("Placement notification error:", notifError);
          }
        }
      } catch (placementError) {
        console.error(
          "❌ CRITICAL: Auto-create placement error:",
          placementError,
        );
        console.error("Stack:", placementError.stack);
        // Don't fail the status update
      }
    }

    // ✅ NOTIFICATIONS FOR STATUS CHANGE
    const companyName =
      application.jobId.recruiterId?.companyInfo?.companyName || "Company";
    const jobTitle = application.jobId.title;
    const studentUserId = application.studentId.userId;

    let notificationData;
    let actionUrl = "/student/applications";

    // ✅ DETERMINE NOTIFICATION BASED ON STATUS
    switch (status) {
      case "pending":
        notificationData = notificationTemplates.applicationPending(
          jobTitle,
          companyName,
        );
        actionUrl = "/student/applications";
        break;

      case "shortlisted":
        notificationData = notificationTemplates.applicationShortlisted(
          jobTitle,
          companyName,
        );
        actionUrl = "/student/applications";
        break;

      case "rejected":
        notificationData = notificationTemplates.applicationRejected(
          jobTitle,
          companyName,
        );
        actionUrl = "/student/applications";
        break;

      case "selected":
        notificationData = notificationTemplates.applicationSelected(
          jobTitle,
          companyName,
        );
        actionUrl = `/student/jobs/${application.jobId._id}`;
        break;
    }

    // ✅ SEND STATUS CHANGE NOTIFICATION
    if (notificationData && studentUserId) {
      try {
        await createNotification(
          {
            userId: studentUserId,
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

        console.log(
          `✅ Notification sent: Application ${oldStatus} → ${status}`,
        );
      } catch (notifError) {
        console.error("Create notification error:", notifError);
      }
    }

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      application,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update application status",
      error: error.message,
    });
  }
};

// @desc    Bulk update application statuses
// @route   PUT /api/applications/bulk-update
// @access  Private (Recruiter)
export const bulkUpdateApplications = async (req, res) => {
  try {
    const { applicationIds, status } = req.body;

    const recruiterId =
      req.user.role === "recruiter" ? req.user.roleDoc._id.toString() : null;

    console.log("\n🔍 BULK UPDATE REQUEST:");
    console.log("User Role:", req.user.role);
    console.log("Recruiter ID:", recruiterId);
    console.log("Application IDs:", applicationIds);
    console.log("Target Status:", status);
    console.log("");

    if (!applicationIds || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No applications selected",
      });
    }

    if (!["shortlisted", "rejected", "pending", "selected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status for bulk update",
      });
    }

    // ---------- FETCH APPLICATIONS ----------
    const applications = await Application.find({
      _id: { $in: applicationIds },
    })
      .populate({
        path: "jobId",
        populate: { path: "recruiterId", select: "companyInfo" },
      })
      .populate({
        path: "studentId",
        select:
          "userId personalInfo registrationNumber placements placementStatus",
      });

    // ---------- AUTHORIZATION ----------
    const unauthorizedApps = applications.filter((app) => {
      if (req.user.role === "admin") return false;

      if (!app.jobId || !app.jobId.recruiterId) return true;

      const jobRecruiterId = app.jobId.recruiterId._id
        ? app.jobId.recruiterId._id.toString()
        : app.jobId.recruiterId.toString();

      return jobRecruiterId !== recruiterId;
    });

    if (unauthorizedApps.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to update ${unauthorizedApps.length} application(s)`,
      });
    }

    console.log(
      `✅ Authorization passed for ${applications.length} applications`,
    );

    // ---------- UPDATE APPLICATION STATUS ----------
    const updateData = { status };

    if (status === "shortlisted") {
      updateData.shortlistedAt = new Date();
      updateData.shortlistedBy = req.user.userId;
    } else if (status === "rejected") {
      updateData.rejectedAt = new Date();
    } else if (status === "selected") {
      updateData.selectedAt = new Date();
    }

    await Application.updateMany({ _id: { $in: applicationIds } }, updateData);

    // ---------- STATUS NOTIFICATIONS ----------
    let notificationsSent = 0;

    await Promise.all(
      applications.map(async (application) => {
        try {
          const companyName =
            application.jobId.recruiterId?.companyInfo?.companyName ||
            "Company";

          const jobTitle = application.jobId.title;
          const studentUserId = application.studentId.userId;

          if (!studentUserId) return;

          let notificationData;
          let actionUrl = "/student/applications";

          if (status === "shortlisted") {
            notificationData = notificationTemplates.applicationShortlisted(
              jobTitle,
              companyName,
            );
          } else if (status === "rejected") {
            notificationData = notificationTemplates.applicationRejected(
              jobTitle,
              companyName,
            );
          } else if (status === "selected") {
            notificationData = notificationTemplates.applicationSelected(
              jobTitle,
              companyName,
            );
            actionUrl = `/student/jobs/${application.jobId._id}`;
          } else if (status === "pending") {
            notificationData = notificationTemplates.applicationPending(
              jobTitle,
              companyName,
            );
            actionUrl = "/student/applications";
          }

          if (notificationData) {
            await createNotification(
              {
                userId: studentUserId,
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

            notificationsSent++;
          }
        } catch (err) {
          console.error(
            `Notification error for application ${application._id}`,
            err,
          );
        }
      }),
    );

    console.log(`✅ Bulk update: ${notificationsSent} notifications sent`);

    // ---------- AUTO PLACEMENT CREATION ----------
    if (status === "selected") {
      let placementsCreated = 0;
      let placementsSkipped = 0;
      let placementsFailed = 0;

      console.log(
        `\n🎯 Starting bulk placement creation for ${applications.length} students`,
      );

      for (const application of applications) {
        try {
          // ⚡ optimization: no extra DB call
          const student = application.studentId;

          if (!student) {
            placementsFailed++;
            continue;
          }

          const job = application.jobId;

          const companyName =
            job.company ||
            job.recruiterId?.companyInfo?.companyName ||
            "Company";

          const jobTitle = job.title || job.role || "";
          const packageAmount =
            job.package || job.salary || job.salaryRange?.max || 0;

          const existingPlacement = student.placements?.find(
            (p) =>
              p.metadata?.applicationId?.toString() ===
              application._id.toString(),
          );

          if (existingPlacement) {
            placementsSkipped++;
            continue;
          }

          const updateResult = await Student.updateOne(
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

          if (updateResult.modifiedCount > 0) {
            placementsCreated++;

            // ---------- PLACEMENT NOTIFICATION ----------
            await createNotification(
              {
                userId: student.userId,
                userRole: "student",
                type: "placement_offer",
                title: "🎉 New Job Offer!",
                message: `Congratulations! You've been selected for ${jobTitle} at ${companyName}. Check "My Placements" to manage your offer.`,
                actionUrl: "/student/placements",
                priority: "high",
                relatedJob: job._id,
                relatedApplication: application._id,
              },
              req.app.get("io"),
            );
          } else {
            placementsFailed++;
          }
        } catch (err) {
          console.error(
            `❌ Bulk placement error for application ${application._id}`,
            err,
          );
          placementsFailed++;
        }
      }

      console.log(`\n📊 Bulk Placement Summary:`);
      console.log(`   ✅ Created: ${placementsCreated}`);
      console.log(`   ℹ️ Skipped: ${placementsSkipped}`);
      console.log(`   ❌ Failed: ${placementsFailed}`);
      console.log(`   📝 Total: ${applications.length}\n`);
    }

    res.json({
      success: true,
      message: `${applicationIds.length} application(s) updated successfully`,
      count: applicationIds.length,
    });
  } catch (error) {
    console.error("Bulk update applications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update applications",
    });
  }
};

// ==================== ADMIN CONTROLLERS ====================

// @desc    Get all applications (admin)
// @route   GET /api/admin/applications
// @access  Private (Admin)
export const getAllApplicationsAdmin = async (req, res) => {
  try {
    const { status, jobId, studentId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (jobId) filter.jobId = jobId;
    if (studentId) filter.studentId = studentId;

    const applications = await Application.find(filter)
      .populate({
        path: "studentId",
        select: "personalInfo registrationNumber",
      })
      .populate({
        path: "jobId",
        select: "title",
        populate: {
          path: "recruiterId",
          select: "companyInfo",
        },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Admin get all applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

// @desc    Recalculate ATS scores for a job and auto-shortlist
// @route   POST /api/applications/job/:jobId/calculate-scores
// @access  Private (Recruiter)
export const recalculateATSScores = async (req, res) => {
  try {
    const recruiterId = req.user.roleDoc._id;
    const { jobId } = req.params;

    // Verify job belongs to recruiter
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Get all applications for this job
    const applications = await Application.find({
      jobId,
      status: "applied",
    }).populate("studentId");

    let processed = 0;
    let shortlisted = 0;

    for (const app of applications) {
      try {
        // Calculate ATS score
        const atsScoreData = await calculateATSScore(app.studentId, job);

        // Update application
        app.atsScore = {
          score: atsScoreData.score,
          strengths: atsScoreData.strengths,
          weaknesses: atsScoreData.weaknesses,
          recommendation: atsScoreData.recommendation,
          calculatedAt: new Date(),
        };
        await app.save();
        processed++;
      } catch (error) {
        console.error(`Error processing application ${app._id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Processed ${processed} applications. ${shortlisted} auto-shortlisted.`,
      stats: {
        total: applications.length,
        processed,
        shortlisted,
      },
    });
  } catch (error) {
    console.error("Recalculate ATS scores error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate ATS scores",
    });
  }
};

// @desc    Export job applications to Excel (Recruiter)
// @route   GET /api/applications/job/:jobId/export
// @access  Private (Recruiter)
export const exportJobApplications = async (req, res) => {
  try {
    const recruiterId = req.user.roleDoc._id;
    const { jobId } = req.params;
    const { status } = req.query; // 'selected' or 'all'

    // Verify job belongs to recruiter
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to export these applications",
      });
    }

    // Build filter
    const filter = { jobId };
    if (status && status !== "all") {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate({
        path: "studentId",
        select: "personalInfo academicInfo registrationNumber",
      })
      .sort({ createdAt: -1 });

    // Import ExcelJS
    const ExcelJS = (await import("exceljs")).default;

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Applications");

    // Define columns (same as admin - 5 columns)
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
    worksheet.eachRow((row) => {
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

// @desc    Auto-shortlist based on ATS score threshold
// @route   POST /api/applications/job/:jobId/auto-shortlist
// @access  Private (Recruiter)
export const autoShortlistByATS = async (req, res) => {
  try {
    const recruiterId = req.user.roleDoc._id;
    const { jobId } = req.params;
    const { threshold } = req.body;

    // Validate threshold
    if (!threshold || threshold < 0 || threshold > 100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid ATS threshold (0-100)",
      });
    }

    // Verify job belongs to recruiter
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Get all applications with ATS scores
    const applications = await Application.find({
      jobId,
      "atsScore.score": { $exists: true, $ne: null },
    }).populate({
      path: "studentId",
      select: "userId personalInfo registrationNumber",
    });

    if (applications.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No applications with ATS scores found. Calculate ATS scores first.",
      });
    }

    let shortlisted = 0;
    let rejected = 0;
    const errors = [];

    // Process each application
    for (const app of applications) {
      try {
        const atsScore = app.atsScore.score;
        const oldStatus = app.status;

        // Skip if already selected (don't change selected students)
        if (oldStatus === "selected") {
          continue;
        }

        // Determine new status based on threshold
        const newStatus = atsScore >= threshold ? "shortlisted" : "rejected";

        // Only update if status actually changes
        if (oldStatus !== newStatus) {
          app.status = newStatus;

          if (newStatus === "shortlisted") {
            app.shortlistedAt = new Date();
            app.shortlistedBy = req.user.userId;
            shortlisted++;
          } else {
            app.rejectedAt = new Date();
            app.rejectionReason = `ATS score (${atsScore}%) below threshold (${threshold}%)`;
            rejected++;
          }

          await app.save();

          // Send notification to student
          try {
            const { createNotification, notificationTemplates } =
              await import("../services/notificationService.js");

            let notificationData;
            if (newStatus === "shortlisted") {
              notificationData = notificationTemplates.applicationShortlisted(
                job.title,
                job.company || "Company",
              );
            } else {
              notificationData = notificationTemplates.applicationRejected(
                job.title,
                job.company || "Company",
              );
            }

            await createNotification(
              {
                userId: app.studentId.userId,
                userRole: "student",
                ...notificationData,
                actionUrl: "/student/applications",
              },
              req.app.get("io"),
            );
          } catch (notifError) {
            console.error("Notification error:", notifError);
          }
        }
      } catch (error) {
        console.error(`Error processing application ${app._id}:`, error);
        errors.push(app._id);
      }
    }

    console.log(`\n📊 Auto-Shortlist Summary (Threshold: ${threshold}%)`);
    console.log(`   ✅ Shortlisted: ${shortlisted}`);
    console.log(`   ❌ Rejected: ${rejected}`);
    console.log(
      `   ⏭️  Skipped (already selected): ${applications.filter((a) => a.status === "selected").length}`,
    );
    console.log(`   ⚠️  Errors: ${errors.length}\n`);

    res.json({
      success: true,
      message: `Auto-shortlist complete`,
      summary: {
        threshold: threshold,
        totalProcessed: applications.length,
        shortlisted,
        rejected,
        skipped: applications.filter((a) => a.status === "selected").length,
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error("Auto-shortlist error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to auto-shortlist applications",
    });
  }
};
