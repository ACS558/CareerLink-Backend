import Student from "../models/Student.js";

// @desc    Get all placements for a student
// @route   GET /api/student/placements
// @access  Private (Student)
export const getMyPlacements = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.userId })
      .select("placements placementStatus")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Sort placements (primary first, then by offer date)
    const sortedPlacements = (student.placements || []).sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return new Date(b.offerDate) - new Date(a.offerDate);
    });

    res.json({
      success: true,
      placements: sortedPlacements,
      totalPlacements: sortedPlacements.length,
      placementStatus: student.placementStatus,
    });
  } catch (error) {
    console.error("Get placements error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch placements",
    });
  }
};
