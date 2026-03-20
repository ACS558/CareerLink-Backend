export const superAdminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  if (req.user.roleDoc.roleLevel !== "super_admin") {
    return res.status(403).json({
      message: "Super Admin privileges required",
    });
  }

  next();
};
