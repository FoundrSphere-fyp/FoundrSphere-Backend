const User = require("../models/User");

const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("userType isActive");

    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "User not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        type: "error",
        message: "Your account has been disabled.",
      });
    }

    if (user.userType !== "admin") {
      return res.status(403).json({
        type: "error",
        message: "Admin access required.",
      });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error("requireAdmin error:", error);
    return res.status(500).json({
      type: "error",
      message: "Authorization check failed.",
    });
  }
};

module.exports = requireAdmin;
