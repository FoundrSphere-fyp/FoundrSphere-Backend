const asyncWrapper = require("../../../middleware/async");
const User = require("../../../models/User");
const { sanitizeUser } = require("../../../utils/adminHelpers");

const updateUserStatus = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  if (String(id) === String(req.userId)) {
    return res.status(400).json({
      type: "error",
      message: "You cannot change your own account status.",
    });
  }

  if (typeof req.body.isActive !== "boolean") {
    return res.status(400).json({
      type: "error",
      message: "isActive (boolean) is required.",
    });
  }

  const user = await User.findById(id).select(
    "-password -resetOtp -resetOtpExpires -resetSessionToken -resetSessionExpires -embedding"
  );

  if (!user) {
    return res.status(404).json({ type: "error", message: "User not found." });
  }

  user.isActive = req.body.isActive;
  await user.save();

  return res.status(200).json({
    type: "success",
    message: req.body.isActive ? "User enabled successfully." : "User disabled successfully.",
    user: sanitizeUser(user),
  });
});

module.exports = updateUserStatus;
