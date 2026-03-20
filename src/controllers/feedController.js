import Post from "../models/Post.js";
import PostView from "../models/PostView.js";
import Student from "../models/Student.js";
import Recruiter from "../models/Recruiter.js";
import Admin from "../models/Admin.js";
import Alumni from "../models/Alumni.js";
import Job from "../models/Job.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import {
  createBulkNotifications,
  notificationTemplates,
} from "../services/notificationService.js";

// Helper function to clean up temp files
const cleanupTempFiles = (files) => {
  if (!files) return;

  const cleanup = (fileArray) => {
    const arr = Array.isArray(fileArray) ? fileArray : [fileArray];
    arr.forEach((file) => {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  };

  if (files.images) cleanup(files.images);
  if (files.documents) cleanup(files.documents);
};

// ============================================
// CREATE POST (Updated for Multer + Notifications)
// ============================================
export const createPost = async (req, res) => {
  try {
    const { textContent, linkedJobId, isPinned } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Validate role
    if (!["admin", "recruiter", "alumni"].includes(userRole)) {
      cleanupTempFiles(req.files);
      return res.status(403).json({
        success: false,
        message: "Students cannot create posts",
      });
    }

    // Validate text content
    if (!textContent || textContent.trim().length === 0) {
      cleanupTempFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Post content is required",
      });
    }

    if (textContent.length > 5000) {
      cleanupTempFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Post content cannot exceed 5000 characters",
      });
    }

    // Get author information
    let authorInfo;
    if (userRole === "admin") {
      authorInfo = await Admin.findOne({ userId }).populate("userId", "email");
    } else if (userRole === "recruiter") {
      authorInfo = await Recruiter.findOne({ userId }).populate(
        "userId",
        "email",
      );
    } else if (userRole === "alumni") {
      authorInfo = await Alumni.findOne({ userId }).populate("userId", "email");
    }

    if (!authorInfo) {
      cleanupTempFiles(req.files);
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Determine author name and photo
    let authorName,
      authorPhoto = null,
      companyName = null;

    if (userRole === "admin") {
      authorName = authorInfo.personalInfo?.name || "Admin";
      authorPhoto = authorInfo.photo?.url;
    } else if (userRole === "recruiter") {
      authorName = authorInfo.companyInfo?.companyName || "Recruiter";
      companyName = authorInfo.companyInfo?.companyName || "Company";
      authorPhoto = authorInfo.companyInfo?.logo?.url;
    } else if (userRole === "alumni") {
      authorName =
        `${authorInfo.personalInfo?.firstName || ""} ${authorInfo.personalInfo?.lastName || ""}`.trim() ||
        "Alumni";
      authorPhoto = authorInfo.photo?.url;
    }

    // ✅ Handle images with multer
    const images = [];
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) {
          cleanupTempFiles(req.files);
          return res.status(400).json({
            success: false,
            message: "Image size cannot exceed 5MB",
          });
        }

        const result = await cloudinary.uploader.upload(file.path, {
          folder: "careerlink/feed/images",
          resource_type: "image",
        });

        images.push({
          url: result.secure_url,
          publicId: result.public_id,
          size: file.size,
          uploadedAt: new Date(),
        });

        fs.unlinkSync(file.path);
      }
    }

    // ✅ Handle documents with multer
    const documents = [];
    if (req.files && req.files.documents) {
      const docFiles = Array.isArray(req.files.documents)
        ? req.files.documents
        : [req.files.documents];

      for (const file of docFiles) {
        if (file.size > 10 * 1024 * 1024) {
          cleanupTempFiles(req.files);
          return res.status(400).json({
            success: false,
            message: "Document size cannot exceed 10MB",
          });
        }

        const allowedTypes = ["pdf", "xlsx", "xls", "docx", "doc"];
        const fileExt = file.originalname.split(".").pop().toLowerCase();

        if (!allowedTypes.includes(fileExt)) {
          cleanupTempFiles(req.files);
          return res.status(400).json({
            success: false,
            message:
              "Invalid document type. Only PDF, Excel, and Word documents allowed",
          });
        }

        const result = await cloudinary.uploader.upload(file.path, {
          folder: "careerlink/feed/documents",
          resource_type: "raw",
          use_filename: true,
          unique_filename: true,
        });

        documents.push({
          url: result.secure_url,
          publicId: result.public_id,
          fileName: file.originalname,
          fileType: fileExt,
          fileSize: file.size,
          uploadedAt: new Date(),
        });

        fs.unlinkSync(file.path);
      }
    }

    // Determine content type
    let contentType = "text";
    if (images.length > 0 && documents.length > 0) contentType = "mixed";
    else if (images.length > 0) contentType = "text-image";
    else if (documents.length > 0) contentType = "text-document";

    // Validate linked job
    let isJobPost = false;
    if (linkedJobId) {
      const job = await Job.findById(linkedJobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Linked job not found",
        });
      }
      isJobPost = true;
    }

    // Admin can pin directly
    const canPinDirectly = userRole === "admin" && isPinned === true;

    // Create post
    const post = await Post.create({
      authorId: userId,
      authorRole: userRole,
      authorName,
      authorPhoto,
      contentType,
      textContent: textContent.trim(),
      images,
      documents,
      linkedJobId: linkedJobId || null,
      isJobPost,
      isPinned: canPinDirectly,
      pinnedBy: canPinDirectly ? userId : null,
      pinnedAt: canPinDirectly ? new Date() : null,
    });

    // ✅ SEND NOTIFICATIONS TO STUDENTS AND ADMINS
    try {
      // Get Socket.IO instance
      const io = req.app.get("io");

      const allNotifications = [];

      // ✅ 1. NOTIFY ALL ACTIVE STUDENTS (for all post types)
      const activeStudents = await Student.find()
        .populate("userId", "_id isActive")
        .select("userId");

      const filteredStudents = activeStudents.filter(
        (s) => s.userId && s.userId.isActive,
      );

      if (filteredStudents.length > 0) {
        let studentTemplate;

        if (userRole === "admin") {
          studentTemplate = notificationTemplates.newPostFromAdmin(textContent);
        } else if (userRole === "recruiter") {
          studentTemplate = notificationTemplates.newPostFromRecruiter(
            companyName,
            textContent,
          );
        } else if (userRole === "alumni") {
          studentTemplate = notificationTemplates.newPostFromAlumni(
            authorName,
            textContent,
          );
        }

        if (studentTemplate) {
          const studentNotifications = filteredStudents.map((student) => ({
            userId: student.userId._id,
            userRole: "student",
            type: studentTemplate.type,
            title: studentTemplate.title,
            message: studentTemplate.message,
            priority: studentTemplate.priority,
            actionUrl: "/student/feed",
          }));

          allNotifications.push(...studentNotifications);
        }
      }

      // ✅ 2. NOTIFY ALL ACTIVE ADMINS (only for recruiter/alumni posts)
      if (userRole === "recruiter" || userRole === "alumni") {
        const activeAdmins = await Admin.find()
          .populate("userId", "_id isActive")
          .select("userId");

        const filteredAdmins = activeAdmins.filter(
          (admin) => admin.userId?.isActive,
        );

        if (filteredAdmins.length > 0) {
          let adminTemplate;

          if (userRole === "recruiter") {
            adminTemplate = notificationTemplates.newPostFromRecruiterToAdmin(
              companyName,
              textContent,
            );
          } else if (userRole === "alumni") {
            adminTemplate = notificationTemplates.newPostFromAlumniToAdmin(
              authorName,
              textContent,
            );
          }

          if (adminTemplate) {
            const adminNotifications = filteredAdmins.map((admin) => ({
              userId: admin.userId,
              userRole: "admin",
              type: adminTemplate.type,
              title: adminTemplate.title,
              message: adminTemplate.message,
              priority: adminTemplate.priority,
              actionUrl: "/admin/feed",
            }));

            allNotifications.push(...adminNotifications);
          }
        }
      }

      // Send all notifications in bulk
      if (allNotifications.length > 0) {
        await createBulkNotifications(allNotifications, io);

        const studentCount = activeStudents.length;
        const adminCount =
          userRole === "recruiter" || userRole === "alumni"
            ? allNotifications.length - studentCount
            : 0;

        console.log(
          `✅ Sent post notifications: ${studentCount} students${adminCount > 0 ? `, ${adminCount} admins` : ""}`,
        );
      }
    } catch (notificationError) {
      console.error("Feed post notification error:", notificationError);
      // Don't fail the post creation if notifications fail
    }

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Create post error:", error);
    cleanupTempFiles(req.files);
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: error.message,
    });
  }
};

// Note: All other functions (getFeed, getPostById, deletePost, pinPost, etc.)
// remain exactly the same as they don't handle file uploads.
// Only createPost and updatePost needed changes for multer.

// UPDATE POST also needs multer changes - adding it here:

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { textContent } = req.body;
    const userId = req.user.userId;

    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      cleanupTempFiles(req.files);
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.authorId.toString() !== userId.toString()) {
      cleanupTempFiles(req.files);
      return res.status(403).json({
        success: false,
        message: "You can only edit your own posts",
      });
    }

    // Update text content
    if (textContent) {
      if (textContent.trim().length === 0) {
        cleanupTempFiles(req.files);
        return res.status(400).json({
          success: false,
          message: "Post content cannot be empty",
        });
      }
      if (textContent.length > 5000) {
        cleanupTempFiles(req.files);
        return res.status(400).json({
          success: false,
          message: "Post content cannot exceed 5000 characters",
        });
      }
      post.textContent = textContent.trim();
    }

    // ✅ Handle new images
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) {
          cleanupTempFiles(req.files);
          return res.status(400).json({
            success: false,
            message: "Image size cannot exceed 5MB",
          });
        }

        const result = await cloudinary.uploader.upload(file.path, {
          folder: "careerlink/feed/images",
          resource_type: "image",
        });

        post.images.push({
          url: result.secure_url,
          publicId: result.public_id,
          size: file.size,
          uploadedAt: new Date(),
        });

        fs.unlinkSync(file.path);
      }
    }

    // ✅ Handle new documents
    if (req.files && req.files.documents) {
      const docFiles = Array.isArray(req.files.documents)
        ? req.files.documents
        : [req.files.documents];

      for (const file of docFiles) {
        if (file.size > 10 * 1024 * 1024) {
          cleanupTempFiles(req.files);
          return res.status(400).json({
            success: false,
            message: "Document size cannot exceed 10MB",
          });
        }

        const allowedTypes = ["pdf", "xlsx", "xls", "docx", "doc"];
        const fileExt = file.originalname.split(".").pop().toLowerCase();

        if (!allowedTypes.includes(fileExt)) {
          cleanupTempFiles(req.files);
          return res.status(400).json({
            success: false,
            message: "Invalid document type",
          });
        }

        const result = await cloudinary.uploader.upload(file.path, {
          folder: "careerlink/feed/documents",
          resource_type: "raw",
        });

        post.documents.push({
          url: result.secure_url,
          publicId: result.public_id,
          fileName: file.originalname,
          fileType: fileExt,
          fileSize: file.size,
          uploadedAt: new Date(),
        });

        fs.unlinkSync(file.path);
      }
    }

    // Update content type
    if (post.images.length > 0 && post.documents.length > 0)
      post.contentType = "mixed";
    else if (post.images.length > 0) post.contentType = "text-image";
    else if (post.documents.length > 0) post.contentType = "text-document";
    else post.contentType = "text";

    await post.save();

    res.json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.error("Update post error:", error);
    cleanupTempFiles(req.files);
    res.status(500).json({
      success: false,
      message: "Failed to update post",
      error: error.message,
    });
  }
};

// All other functions remain unchanged - copying them below:

export const getFeed = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { page = 1, limit = 10, filter = "all" } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = { isDeleted: false };

    if (userRole === "student") {
      if (filter === "announcements") query.authorRole = "admin";
      else if (filter === "jobs")
        query.$or = [{ isJobPost: true }, { authorRole: "recruiter" }];
      else if (filter === "alumni") query.authorRole = "alumni";
    } else if (userRole === "recruiter" || userRole === "alumni") {
      query.authorId = userId;
    }

    const totalPosts = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("linkedJobId", "title location jobType")
      .lean();

    const totalPages = Math.ceil(totalPosts / parseInt(limit));
    const hasMore = parseInt(page) < totalPages;

    res.json({
      success: true,
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPosts,
        postsPerPage: parseInt(limit),
        hasMore,
      },
    });
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feed",
      error: error.message,
    });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const post = await Post.findOne({ _id: id, isDeleted: false })
      .populate("linkedJobId", "title location jobType salaryRange")
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (userRole === "recruiter" || userRole === "alumni") {
      if (post.authorId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own posts",
        });
      }
    }

    res.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch post",
      error: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isAuthor = post.authorId.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this post",
      });
    }

    post.isDeleted = true;
    post.deletedBy = userId;
    post.deletedAt = new Date();
    await post.save();

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: error.message,
    });
  }
};

export const pinPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.isPinned) {
      return res.status(400).json({
        success: false,
        message: "Post is already pinned",
      });
    }

    const isAuthor = post.authorId.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only pin your own posts",
      });
    }

    if (!isAdmin) {
      const pinLimits = { recruiter: 3, alumni: 2 };
      const currentPinnedCount = await Post.countDocuments({
        authorId: userId,
        isPinned: true,
        isDeleted: false,
      });

      if (currentPinnedCount >= pinLimits[userRole]) {
        const oldestPinned = await Post.findOne({
          authorId: userId,
          isPinned: true,
          isDeleted: false,
        }).sort({ pinnedAt: 1 });

        if (oldestPinned) {
          oldestPinned.isPinned = false;
          oldestPinned.pinnedBy = null;
          oldestPinned.pinnedAt = null;
          await oldestPinned.save();
        }
      }
    }

    post.isPinned = true;
    post.pinnedBy = userId;
    post.pinnedAt = new Date();
    await post.save();

    res.json({
      success: true,
      message: "Post pinned successfully",
      post,
    });
  } catch (error) {
    console.error("Pin post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to pin post",
      error: error.message,
    });
  }
};

export const unpinPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!post.isPinned) {
      return res.status(400).json({
        success: false,
        message: "Post is not pinned",
      });
    }

    const isAuthor = post.authorId.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only unpin your own posts",
      });
    }

    post.isPinned = false;
    post.pinnedBy = null;
    post.pinnedAt = null;
    await post.save();

    res.json({
      success: true,
      message: "Post unpinned successfully",
      post,
    });
  } catch (error) {
    console.error("Unpin post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unpin post",
      error: error.message,
    });
  }
};

export const trackView = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const existingView = await PostView.findOne({
      postId: id,
      viewedBy: userId,
    });

    if (!existingView) {
      await PostView.create({
        postId: id,
        viewedBy: userId,
        viewerRole: userRole,
        viewedAt: new Date(),
      });

      post.viewCount += 1;
      await post.save();
    }

    res.json({
      success: true,
      message: "View tracked",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({
        success: true,
        message: "View already tracked",
      });
    }

    console.error("Track view error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track view",
      error: error.message,
    });
  }
};

export const getPostAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isAuthor = post.authorId.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only view analytics for your own posts",
      });
    }

    const uniqueViews = await PostView.countDocuments({ postId: id });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const viewsToday = await PostView.countDocuments({
      postId: id,
      viewedAt: { $gte: today },
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const viewsThisWeek = await PostView.countDocuments({
      postId: id,
      viewedAt: { $gte: weekAgo },
    });

    const viewsByRole = await PostView.aggregate([
      { $match: { postId: post._id } },
      { $group: { _id: "$viewerRole", count: { $sum: 1 } } },
    ]);

    const roleStats = {
      student: 0,
      admin: 0,
      recruiter: 0,
      alumni: 0,
    };

    viewsByRole.forEach((item) => {
      roleStats[item._id] = item.count;
    });

    const viewsWithTime = await PostView.find({ postId: id })
      .sort({ viewedAt: -1 })
      .limit(1);

    let peakViewTime = null;
    if (viewsWithTime.length > 0) {
      peakViewTime = viewsWithTime[0].viewedAt;
    }

    res.json({
      success: true,
      analytics: {
        viewCount: post.viewCount,
        uniqueViews,
        viewsToday,
        viewsThisWeek,
        viewsByRole: roleStats,
        peakViewTime,
        createdAt: post.createdAt,
        isPinned: post.isPinned,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};

export const removeImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { publicId } = req.body;
    const userId = req.user.userId;

    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.authorId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own posts",
      });
    }

    const imageIndex = post.images.findIndex(
      (img) => img.publicId === publicId,
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found in post",
      });
    }

    await cloudinary.uploader.destroy(publicId);
    post.images.splice(imageIndex, 1);

    if (post.images.length === 0 && post.documents.length > 0) {
      post.contentType = "text-document";
    } else if (post.images.length === 0 && post.documents.length === 0) {
      post.contentType = "text";
    }

    await post.save();

    res.json({
      success: true,
      message: "Image removed successfully",
      post,
    });
  } catch (error) {
    console.error("Remove image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove image",
      error: error.message,
    });
  }
};

export const removeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { publicId } = req.body;
    const userId = req.user.userId;

    const post = await Post.findOne({ _id: id, isDeleted: false });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.authorId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own posts",
      });
    }

    const docIndex = post.documents.findIndex(
      (doc) => doc.publicId === publicId,
    );

    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found in post",
      });
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    post.documents.splice(docIndex, 1);

    if (post.documents.length === 0 && post.images.length > 0) {
      post.contentType = "text-image";
    } else if (post.documents.length === 0 && post.images.length === 0) {
      post.contentType = "text";
    }

    await post.save();

    res.json({
      success: true,
      message: "Document removed successfully",
      post,
    });
  } catch (error) {
    console.error("Remove document error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove document",
      error: error.message,
    });
  }
};
