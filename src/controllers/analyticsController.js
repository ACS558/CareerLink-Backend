import Student from "../models/Student.js";
import Recruiter from "../models/Recruiter.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import User from "../models/User.js";

// ============================================
// STUDENT DASHBOARD STATISTICS
// ============================================

export const getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user.roleDoc._id;

    // Get student applications
    const applications = await Application.find({ studentId }).populate(
      "jobId",
      "title salaryRange",
    );

    // Calculate statistics
    const totalApplications = applications.length;
    const appliedCount = applications.filter(
      (app) => app.status === "applied",
    ).length;
    const shortlistedCount = applications.filter(
      (app) => app.status === "shortlisted",
    ).length;
    const rejectedCount = applications.filter(
      (app) => app.status === "rejected",
    ).length;
    const selectedCount = applications.filter(
      (app) => app.status === "selected",
    ).length;

    // Average ATS Score
    const scoresWithValue = applications.filter((app) => app.atsScore?.score);
    const avgATSScore =
      scoresWithValue.length > 0
        ? Math.round(
            scoresWithValue.reduce((sum, app) => sum + app.atsScore.score, 0) /
              scoresWithValue.length,
          )
        : 0;

    // Get student profile completion
    const student = await Student.findById(studentId);
    const profileCompletion = student.profileCompleted
      ? 100
      : calculateProfileCompletion(student);

    // Recent applications (last 5)
    const recentApplications = applications
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
      .slice(0, 5)
      .map((app) => ({
        jobTitle: app.jobId?.title || "N/A",
        company: app.jobId?.recruiterId?.companyInfo?.companyName || "N/A",
        status: app.status,
        appliedAt: app.appliedAt,
        atsScore: app.atsScore?.score || 0,
      }));

    // Application trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const applicationTrend = await Application.aggregate([
      {
        $match: {
          studentId: studentId,
          appliedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalApplications,
        appliedCount,
        shortlistedCount,
        rejectedCount,
        selectedCount,
        avgATSScore,
        profileCompletion,
        recentApplications,
        applicationTrend: applicationTrend.map((item) => ({
          date: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error("Get student dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// Helper function to calculate profile completion
function calculateProfileCompletion(student) {
  let completed = 0;
  let total = 10;

  if (student.personalInfo?.firstName) completed++;
  if (student.personalInfo?.phoneNumber) completed++;
  if (student.academicInfo?.branch) completed++;
  if (student.academicInfo?.cgpa) completed++;
  if (student.skills?.length > 0) completed++;
  if (student.projects?.length > 0) completed++;
  if (student.resume?.url) completed++;
  if (student.photo?.url) completed++;
  if (student.internships?.length > 0) completed++;
  if (student.certifications?.length > 0) completed++;

  return Math.round((completed / total) * 100);
}

// ============================================
// RECRUITER DASHBOARD STATISTICS
// ============================================

export const getRecruiterDashboardStats = async (req, res) => {
  try {
    const recruiterId = req.user.roleDoc._id;

    // Get recruiter's jobs
    const jobs = await Job.find({ recruiterId });
    const jobIds = jobs.map((job) => job._id);

    // Get applications for recruiter's jobs
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate("studentId", "personalInfo academicInfo")
      .populate("jobId", "title");

    // Job statistics
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(
      (job) => job.approvalStatus === "approved" && job.isActive,
    ).length;
    const pendingJobs = jobs.filter(
      (job) => job.approvalStatus === "pending",
    ).length;
    const rejectedJobs = jobs.filter(
      (job) => job.approvalStatus === "rejected",
    ).length;

    // Application statistics
    const totalApplications = applications.length;
    const newApplications = applications.filter(
      (app) => app.status === "applied",
    ).length;
    const shortlistedApplications = applications.filter(
      (app) => app.status === "shortlisted",
    ).length;
    const selectedApplications = applications.filter(
      (app) => app.status === "selected",
    ).length;

    // Top performing jobs (by application count)
    const jobApplicationCounts = {};
    applications.forEach((app) => {
      const jobId = app.jobId._id.toString();
      jobApplicationCounts[jobId] = (jobApplicationCounts[jobId] || 0) + 1;
    });

    const topJobs = jobs
      .map((job) => ({
        title: job.title,
        applications: jobApplicationCounts[job._id.toString()] || 0,
        status: job.approvalStatus,
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5);

    // Application trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const applicationTrend = await Application.aggregate([
      {
        $match: {
          jobId: { $in: jobIds },
          appliedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Status distribution
    const statusDistribution = [
      { status: "Applied", count: newApplications },
      { status: "Shortlisted", count: shortlistedApplications },
      {
        status: "Rejected",
        count: applications.filter((app) => app.status === "rejected").length,
      },
      { status: "Selected", count: selectedApplications },
      {
        status: "On Hold",
        count: applications.filter((app) => app.status === "on-hold").length,
      },
    ];

    // Recent applications
    const recentApplications = applications
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
      .slice(0, 5)
      .map((app) => ({
        studentName:
          `${app.studentId?.personalInfo?.firstName || ""} ${app.studentId?.personalInfo?.lastName || ""}`.trim() ||
          "N/A",
        jobTitle: app.jobId?.title || "N/A",
        atsScore: app.atsScore?.score || 0,
        status: app.status,
        appliedAt: app.appliedAt,
      }));

    res.json({
      success: true,
      stats: {
        totalJobs,
        activeJobs,
        pendingJobs,
        rejectedJobs,
        totalApplications,
        newApplications,
        shortlistedApplications,
        selectedApplications,
        topJobs,
        applicationTrend: applicationTrend.map((item) => ({
          date: item._id,
          count: item.count,
        })),
        statusDistribution,
        recentApplications,
      },
    });
  } catch (error) {
    console.error("Get recruiter dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// ============================================
// ADMIN DASHBOARD STATISTICS
// ============================================

export const getAdminDashboardStats = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalRecruiters = await Recruiter.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    // Job statistics
    const totalJobs = await Job.countDocuments();
    const approvedJobs = await Job.countDocuments({
      approvalStatus: "approved",
    });
    const pendingJobs = await Job.countDocuments({ approvalStatus: "pending" });
    const activeJobs = await Job.countDocuments({
      approvalStatus: "approved",
      isActive: true,
    });

    // Application statistics
    const totalApplications = await Application.countDocuments();
    const applications = await Application.find({});

    const appliedCount = applications.filter(
      (app) => app.status === "applied",
    ).length;
    const shortlistedCount = applications.filter(
      (app) => app.status === "shortlisted",
    ).length;
    const selectedCount = applications.filter(
      (app) => app.status === "selected",
    ).length;
    const rejectedCount = applications.filter(
      (app) => app.status === "rejected",
    ).length;

    // Placement statistics
    const placedStudents = await Student.countDocuments({
      placementStatus: "placed",
    });
    const placementPercentage =
      totalStudents > 0
        ? Math.round((placedStudents / totalStudents) * 100)
        : 0;

    // Average package (from placed students)
    const placedStudentsData = await Student.find({
      placementStatus: "placed",
      package: { $exists: true, $ne: null },
    });

    const avgPackage =
      placedStudentsData.length > 0
        ? Math.round(
            (placedStudentsData.reduce((sum, s) => sum + (s.package || 0), 0) /
              placedStudentsData.length) *
              10,
          ) / 10
        : 0;

    const highestPackage =
      placedStudentsData.length > 0
        ? Math.max(...placedStudentsData.map((s) => s.package || 0))
        : 0;

    // Recent activities
    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("recruiterId", "companyInfo")
      .select("title approvalStatus createdAt");

    const recentApplications = await Application.find()
      .sort({ appliedAt: -1 })
      .limit(5)
      .populate("studentId", "personalInfo registrationNumber")
      .populate("jobId", "title")
      .select("status appliedAt");

    // Applications over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const applicationTrend = await Application.aggregate([
      {
        $match: {
          appliedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Status distribution
    const statusDistribution = [
      { name: "Applied", value: appliedCount },
      { name: "Shortlisted", value: shortlistedCount },
      { name: "Selected", value: selectedCount },
      { name: "Rejected", value: rejectedCount },
      {
        name: "On Hold",
        value: applications.filter((app) => app.status === "on-hold").length,
      },
    ];

    // Branch-wise applications (top 5 branches)
    const branchStats = await Application.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $group: {
          _id: "$student.academicInfo.branch",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const branchDistribution = branchStats.map((item) => ({
      branch: item._id || "Not Specified",
      count: item.count,
    }));

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          recruiters: totalRecruiters,
          active: activeUsers,
        },
        jobs: {
          total: totalJobs,
          approved: approvedJobs,
          pending: pendingJobs,
          active: activeJobs,
        },
        applications: {
          total: totalApplications,
          applied: appliedCount,
          shortlisted: shortlistedCount,
          selected: selectedCount,
          rejected: rejectedCount,
        },
        placements: {
          placed: placedStudents,
          percentage: placementPercentage,
          avgPackage,
          highestPackage,
        },
        recentActivities: {
          jobs: recentJobs.map((job) => ({
            title: job.title,
            company: job.recruiterId?.companyInfo?.companyName || "N/A",
            status: job.approvalStatus,
            date: job.createdAt,
          })),
          applications: recentApplications.map((app) => ({
            student:
              `${app.studentId?.personalInfo?.firstName || ""} ${app.studentId?.personalInfo?.lastName || ""}`.trim() ||
              app.studentId?.registrationNumber ||
              "N/A",
            job: app.jobId?.title || "N/A",
            status: app.status,
            date: app.appliedAt,
          })),
        },
        charts: {
          applicationTrend: applicationTrend.map((item) => ({
            date: item._id,
            applications: item.count,
          })),
          statusDistribution,
          branchDistribution,
        },
      },
    });
  } catch (error) {
    console.error("Get admin dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// ============================================
// ADVANCED ANALYTICS (ADMIN)
// ============================================

export const getAdvancedAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, branch, company } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        appliedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Get all applications with filters
    let applicationQuery = Application.find(dateFilter)
      .populate("studentId", "personalInfo academicInfo registrationNumber")
      .populate("jobId", "title recruiterId company")
      .populate({
        path: "jobId",
        populate: {
          path: "recruiterId",
          select: "companyInfo",
        },
      });

    const applications = await applicationQuery;

    // Filter by branch if specified
    let filteredApplications = applications;
    if (branch) {
      filteredApplications = applications.filter(
        (app) => app.studentId?.academicInfo?.branch === branch,
      );
    }

    // Filter by company if specified
    if (company) {
      filteredApplications = filteredApplications.filter(
        (app) =>
          app.jobId?.recruiterId?.companyInfo?.companyName === company ||
          app.jobId?.company === company,
      );
    }

    // Branch-wise placement statistics
    const branchWiseStats = {};
    filteredApplications.forEach((app) => {
      const branch = app.studentId?.academicInfo?.branch || "Unknown";
      if (!branchWiseStats[branch]) {
        branchWiseStats[branch] = {
          total: 0,
          selected: 0,
          avgATS: 0,
          atsScores: [],
        };
      }
      branchWiseStats[branch].total++;
      if (app.status === "selected") {
        branchWiseStats[branch].selected++;
      }
      if (app.atsScore?.score) {
        branchWiseStats[branch].atsScores.push(app.atsScore.score);
      }
    });

    // Calculate averages
    const branchAnalytics = Object.keys(branchWiseStats)
      .map((branch) => {
        const stats = branchWiseStats[branch];
        const avgATS =
          stats.atsScores.length > 0
            ? Math.round(
                stats.atsScores.reduce((a, b) => a + b, 0) /
                  stats.atsScores.length,
              )
            : 0;
        const placementRate =
          stats.total > 0
            ? Math.round((stats.selected / stats.total) * 100)
            : 0;

        return {
          branch,
          totalApplications: stats.total,
          selected: stats.selected,
          placementRate,
          avgATSScore: avgATS,
        };
      })
      .sort((a, b) => b.totalApplications - a.totalApplications);

    // Company-wise hiring statistics
    const companyWiseStats = {};
    filteredApplications.forEach((app) => {
      const company =
        app.jobId?.recruiterId?.companyInfo?.companyName ||
        app.jobId?.company ||
        "Unknown";
      if (!companyWiseStats[company]) {
        companyWiseStats[company] = {
          total: 0,
          selected: 0,
          jobs: new Set(),
        };
      }
      companyWiseStats[company].total++;
      if (app.status === "selected") {
        companyWiseStats[company].selected++;
      }
      if (app.jobId?._id) {
        companyWiseStats[company].jobs.add(app.jobId._id.toString());
      }
    });

    const companyAnalytics = Object.keys(companyWiseStats)
      .map((company) => ({
        company,
        totalApplications: companyWiseStats[company].total,
        hired: companyWiseStats[company].selected,
        jobsPosted: companyWiseStats[company].jobs.size,
      }))
      .sort((a, b) => b.hired - a.hired);

    // CGPA vs Success Rate
    const cgpaRanges = [
      { min: 9, max: 10, label: "9.0-10.0" },
      { min: 8, max: 9, label: "8.0-8.9" },
      { min: 7, max: 8, label: "7.0-7.9" },
      { min: 6, max: 7, label: "6.0-6.9" },
      { min: 0, max: 6, label: "Below 6.0" },
    ];

    const cgpaAnalytics = cgpaRanges.map((range) => {
      const appsInRange = filteredApplications.filter((app) => {
        const cgpa = app.studentId?.academicInfo?.cgpa || 0;
        return cgpa >= range.min && cgpa < range.max;
      });

      const selected = appsInRange.filter(
        (app) => app.status === "selected",
      ).length;
      const successRate =
        appsInRange.length > 0
          ? Math.round((selected / appsInRange.length) * 100)
          : 0;

      return {
        cgpaRange: range.label,
        applications: appsInRange.length,
        selected,
        successRate,
      };
    });

    // Skills demand analysis
    const skillsDemand = {};
    const jobs = await Job.find({ approvalStatus: "approved" });
    jobs.forEach((job) => {
      job.skillsRequired?.forEach((skill) => {
        skillsDemand[skill] = (skillsDemand[skill] || 0) + 1;
      });
    });

    const topSkills = Object.keys(skillsDemand)
      .map((skill) => ({ skill, demand: skillsDemand[skill] }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 10);

    res.json({
      success: true,
      analytics: {
        overview: {
          totalApplications: filteredApplications.length,
          totalSelected: filteredApplications.filter(
            (app) => app.status === "selected",
          ).length,
          overallSuccessRate:
            filteredApplications.length > 0
              ? Math.round(
                  (filteredApplications.filter(
                    (app) => app.status === "selected",
                  ).length /
                    filteredApplications.length) *
                    100,
                )
              : 0,
        },
        branchWise: branchAnalytics,
        companyWise: companyAnalytics,
        cgpaAnalysis: cgpaAnalytics,
        topSkills,
      },
    });
  } catch (error) {
    console.error("Get advanced analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch advanced analytics",
      error: error.message,
    });
  }
};

// ============================================
// EXPORT DATA (✅ UPDATED WITH FILTERS)
// ============================================

export const exportData = async (req, res) => {
  try {
    const { type, format, branch, company } = req.query; // ✅ ADDED branch and company

    let data = [];

    if (type === "students") {
      // ✅ BUILD FILTER FOR STUDENTS
      const filter = {};
      if (branch) filter["academicInfo.branch"] = branch;

      const students = await Student.find(filter)
        .populate("userId", "email")
        .select(
          "registrationNumber personalInfo academicInfo placementStatus package",
        );

      data = students.map((s) => ({
        "Registration Number": s.registrationNumber,
        Name: `${s.personalInfo?.firstName || ""} ${s.personalInfo?.lastName || ""}`.trim(),
        Email: s.userId?.email || "",
        Branch: s.academicInfo?.branch || "",
        CGPA: s.academicInfo?.cgpa || "",
        "Placement Status": s.placementStatus || "unplaced",
        "Package (LPA)": s.package || "",
      }));
    } else if (type === "applications") {
      // ✅ BUILD FILTER FOR APPLICATIONS
      const filter = {};

      if (branch) {
        const studentsInBranch = await Student.find({
          "academicInfo.branch": branch,
        }).select("_id");
        filter.studentId = { $in: studentsInBranch.map((s) => s._id) };
      }

      if (company) {
        const jobsFromCompany = await Job.find({
          $or: [
            { company: company },
            { "recruiterId.companyInfo.companyName": company },
          ],
        }).select("_id");
        filter.jobId = { $in: jobsFromCompany.map((j) => j._id) };
      }

      const applications = await Application.find(filter)
        .populate("studentId", "registrationNumber personalInfo academicInfo")
        .populate("jobId", "title company")
        .populate({
          path: "jobId",
          populate: { path: "recruiterId", select: "companyInfo" },
        });

      data = applications.map((app) => ({
        "Student Reg No": app.studentId?.registrationNumber || "",
        "Student Name":
          `${app.studentId?.personalInfo?.firstName || ""} ${app.studentId?.personalInfo?.lastName || ""}`.trim(),
        Branch: app.studentId?.academicInfo?.branch || "",
        CGPA: app.studentId?.academicInfo?.cgpa || "",
        "Job Title": app.jobId?.title || "",
        Company:
          app.jobId?.company ||
          app.jobId?.recruiterId?.companyInfo?.companyName ||
          "",
        Status: app.status,
        "ATS Score": app.atsScore?.score || "",
        "Applied Date": app.appliedAt?.toISOString().split("T")[0] || "",
      }));
    } else if (type === "jobs") {
      // ✅ BUILD FILTER FOR JOBS
      const filter = {};
      if (company) {
        filter.$or = [
          { company: company },
          { "recruiterId.companyInfo.companyName": company },
        ];
      }

      const jobs = await Job.find(filter).populate(
        "recruiterId",
        "companyInfo",
      );

      data = jobs.map((job) => ({
        "Job Title": job.title,
        Company: job.company || job.recruiterId?.companyInfo?.companyName || "",
        Location: job.location || "",
        Type: job.jobType || "",
        "Salary Range": `${job.salaryRange?.min || ""}-${job.salaryRange?.max || ""} ${job.salaryType || ""}`,
        Status: job.approvalStatus,
        "Posted Date": job.createdAt?.toISOString().split("T")[0] || "",
      }));
    }

    // Return JSON (frontend will convert to CSV)
    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("Export data error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export data",
      error: error.message,
    });
  }
};
