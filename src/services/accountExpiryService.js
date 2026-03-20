import Student from "../models/Student.js";

// Update account statuses daily
export const updateAccountStatuses = async () => {
  try {
    const today = new Date();

    // Move students to career guidance mode (day 365+)
    await Student.updateMany(
      {
        careerGuidanceStartDate: { $lte: today },
        expiryDate: { $gt: today },
        accountStatus: "active",
      },
      { $set: { accountStatus: "career_guidance_mode" } },
    );

    // Mark expired accounts (day 375+)
    await Student.updateMany(
      {
        expiryDate: { $lte: today },
        accountStatus: { $ne: "expired" },
        isDeleted: false,
      },
      { $set: { accountStatus: "expired" } },
    );

    console.log("✅ Account statuses updated");
  } catch (error) {
    console.error("❌ Status update error:", error);
  }
};

// Soft delete expired accounts
export const softDeleteExpiredAccounts = async () => {
  try {
    const today = new Date();

    await Student.updateMany(
      {
        expiryDate: { $lte: today },
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
    );

    console.log("✅ Expired accounts soft deleted");
  } catch (error) {
    console.error("❌ Soft delete error:", error);
  }
};

// Permanent delete (after 90 days)
export const permanentDeleteOldAccounts = async () => {
  try {
    const today = new Date();

    const result = await Student.deleteMany({
      deletionScheduledAt: { $lte: today },
      isDeleted: true,
    });

    console.log(`✅ Permanently deleted ${result.deletedCount} accounts`);
  } catch (error) {
    console.error("❌ Permanent delete error:", error);
  }
};
