import Notification from "../models/Notification.js";

// Create notification helper
export const createNotification = async (
  {
    userId,
    userRole,
    type,
    title,
    message,
    relatedJob = null,
    relatedApplication = null,
    relatedUser = null,
    actionUrl = null,
    priority = "medium",
  },
  io = null,
) => {
  try {
    const notification = await Notification.create({
      userId,
      userRole,
      type,
      title,
      message,
      relatedJob,
      relatedApplication,
      relatedUser,
      actionUrl,
      priority,
    });

    console.log(`📬 Notification created for ${userRole} ${userId}: ${title}`);

    // ✅ EMIT REAL-TIME NOTIFICATION VIA SOCKET
    if (io) {
      try {
        // Get unread count
        const unreadCount = await Notification.countDocuments({
          userId,
          isRead: false,
        });

        // Emit to user's room
        io.to(userId.toString()).emit("new_notification", {
          notification: {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            actionUrl: notification.actionUrl,
            createdAt: notification.createdAt,
          },
          unreadCount,
        });

        console.log(`🔔 Real-time notification sent to user ${userId}`);
      } catch (socketError) {
        console.error("Socket emit error:", socketError);
        // Don't fail notification creation if socket fails
      }
    }

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};

export const createBulkNotifications = async (notifications, io = null) => {
  try {
    // Create all notifications at once
    const createdNotifications = await Notification.insertMany(notifications);

    console.log(`📬 ${createdNotifications.length} bulk notifications created`);

    // ✅ EMIT REAL-TIME NOTIFICATIONS VIA SOCKET
    if (io) {
      // Group notifications by userId for efficient socket emission
      const notificationsByUser = {};

      createdNotifications.forEach((notification) => {
        const userId = notification.userId.toString();
        if (!notificationsByUser[userId]) {
          notificationsByUser[userId] = [];
        }
        notificationsByUser[userId].push(notification);
      });

      // Emit to each user
      for (const [userId, userNotifications] of Object.entries(
        notificationsByUser,
      )) {
        try {
          // Get unread count for this user
          const unreadCount = await Notification.countDocuments({
            userId,
            isRead: false,
          });

          // Emit the latest notification to the user's room
          const latestNotification = userNotifications[0];
          io.to(userId).emit("new_notification", {
            notification: {
              _id: latestNotification._id,
              type: latestNotification.type,
              title: latestNotification.title,
              message: latestNotification.message,
              priority: latestNotification.priority,
              actionUrl: latestNotification.actionUrl,
              createdAt: latestNotification.createdAt,
            },
            unreadCount,
          });
        } catch (socketError) {
          console.error(`Socket emit error for user ${userId}:`, socketError);
          // Continue with other users
        }
      }

      console.log(
        `🔔 Bulk real-time notifications sent to ${Object.keys(notificationsByUser).length} users`,
      );
    }

    return createdNotifications;
  } catch (error) {
    console.error("Create bulk notifications error:", error);
    return [];
  }
};

// Notification templates
export const notificationTemplates = {
  // Student notifications
  applicationShortlisted: (jobTitle, companyName) => ({
    type: "application_shortlisted",
    title: "Application Shortlisted! 🎉",
    message: `Congratulations! You've been shortlisted for ${jobTitle} at ${companyName}.`,
    priority: "high",
  }),

  applicationRejected: (jobTitle, companyName) => ({
    type: "application_rejected",
    title: "Application Update",
    message: `Your application for ${jobTitle} at ${companyName} was not successful this time.`,
    priority: "medium",
  }),

  applicationSelected: (jobTitle, companyName) => ({
    type: "application_selected",
    title: "You're Selected! 🎊",
    message: `Congratulations! You've been selected for ${jobTitle} at ${companyName}.`,
    priority: "high",
  }),

  applicationPending: (jobTitle, companyName) => ({
    type: "application_pending",
    title: "📋 Application Under Review",
    message: `Your application for ${jobTitle} at ${companyName} is being reviewed.`,
    priority: "medium",
  }),

  // Recruiter notifications
  jobApproved: (jobTitle) => ({
    type: "job_approved",
    title: "Job Posting Approved ✅",
    message: `Your job posting "${jobTitle}" has been approved and is now live.`,
    priority: "high",
  }),

  jobRejected: (jobTitle, reason) => ({
    type: "job_rejected",
    title: "Job Posting Rejected ❌",
    message: `Your job posting "${jobTitle}" was rejected. Reason: ${reason}`,
    priority: "high",
  }),

  recruiterApproved: () => ({
    type: "recruiter_approved",
    title: "Account Approved! 🎉",
    message: "Your recruiter account has been approved. You can now post jobs.",
    priority: "high",
  }),

  recruiterRejected: (reason) => ({
    type: "recruiter_rejected",
    title: "Account Rejected",
    message: `Your recruiter account was not approved. Reason: ${reason}`,
    priority: "high",
  }),

  // Alumni notifications
  alumniApproved: () => ({
    type: "alumni_approved",
    title: "Account Approved! 🎓",
    message: "Your alumni account has been verified and approved.",
    priority: "high",
  }),

  alumniRejected: (reason) => ({
    type: "alumni_rejected",
    title: "Account Rejected",
    message: `Your alumni account was not approved. Reason: ${reason}`,
    priority: "high",
  }),
  extensionApproved: (days) => ({
    type: "extension_approved",
    title: "✅ Extension Request Approved",
    message: `Your account extension request has been approved! Your account is now valid for ${days} more days.`,
  }),

  extensionRejected: () => ({
    type: "extension_rejected",
    title: "❌ Extension Request Rejected",
    message:
      "Your account extension request has been reviewed and rejected. Please contact administration for more details.",
  }),

  newExtensionRequest: (studentName, registrationNumber) => ({
    type: "extension_request",
    title: "📝 New Extension Request",
    message: `${studentName} (${registrationNumber}) has requested an account extension.`,
  }),

  placementOffer: (jobTitle, companyName) => ({
    type: "placement_offer",
    title: "🎉 New Job Offer!",
    message: `Congratulations! You've been selected for ${jobTitle} at ${companyName}. Check "My Placements" to manage your offer.`,
    priority: "high",
  }),

  // ✅ NEW: Feed Post Notifications
  newPostFromAdmin: (content) => ({
    type: "new_post",
    title: "📢 New Announcement from Admin",
    message: `Admin posted: ${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`,
    priority: "high",
  }),

  newPostFromRecruiter: (companyName, content) => ({
    type: "new_post",
    title: "💼 New Update from Recruiter",
    message: `${companyName} posted: ${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`,
    priority: "medium",
  }),

  newPostFromAlumni: (authorName, content) => ({
    type: "new_post",
    title: "🎓 New Post from Alumni",
    message: `${authorName} shared: ${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`,
    priority: "medium",
  }),
  newPostFromRecruiterToAdmin: (companyName, content) => ({
    type: "new_post_admin",
    title: "💼 New Recruiter Post",
    message: `${companyName} posted: ${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`,
    priority: "medium",
  }),

  newPostFromAlumniToAdmin: (authorName, content) => ({
    type: "new_post_admin",
    title: "🎓 New Alumni Post",
    message: `${authorName} shared: ${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`,
    priority: "medium",
  }),

  newReferralPending: (company, role) => ({
    type: "new_referral_pending",
    title: "📌 New Referral Pending Approval",
    message: `${company} referral for ${role} is awaiting approval.`,
    priority: "high",
  }),
  referralApproved: (company) => ({
    type: "referral_approved",
    title: "Referral Approved 🎉",
    message: `Your referral for ${company} has been approved.`,
    priority: "high",
  }),
  referralRejected: (company, reason) => ({
    type: "referral_rejected",
    title: "Referral Rejected ❌",
    message: `Your referral for ${company} was rejected. Reason: ${reason}`,
    priority: "high",
  }),
  newReferralPosted: (company, role) => ({
    type: "new_referral_posted",
    title: "🎯 New Referral Opportunity",
    message: `${company} is offering a referral for ${role}.`,
    priority: "high",
  }),
};
