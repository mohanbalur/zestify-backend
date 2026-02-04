export const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      // Check authentication
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Please login first."
        });
      }

      // Check authorization
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied for role: ${req.user.role}`
        });
     }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Authorization error",
        error: error.message
      });
    }
  };
};
