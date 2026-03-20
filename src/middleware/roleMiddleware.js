export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user info exists (from authMiddleware)
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions.",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        message: "Server error in authorization",
        error: error.message,
      });
    }
  };
};
