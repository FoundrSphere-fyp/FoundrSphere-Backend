const asyncWrapper = require("../../../middleware/async");
const User = require("../../../models/User");
const { sanitizeUser } = require("../../../utils/adminHelpers");

const updateUser = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ type: "error", message: "User not found." });
  }

  const { fullName, email, username, userType, bio, isActive } = req.body;

  if (email !== undefined) {
    const existing = await User.findOne({ email: String(email).trim(), _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ type: "error", message: "Email is already in use." });
    }
    user.email = String(email).trim();
  }

  if (username !== undefined) {
    const existing = await User.findOne({ username: String(username).trim(), _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ type: "error", message: "Username is already in use." });
    }
    user.username = String(username).trim();
  }

  if (fullName !== undefined) user.fullName = String(fullName).trim();
  if (bio !== undefined) user.bio = String(bio).trim();

  if (userType !== undefined) {
    const allowed = ["founder", "investor", "admin"];
    if (!allowed.includes(userType)) {
      return res.status(400).json({ type: "error", message: "Invalid userType." });
    }
    if (String(id) === String(req.userId) && userType !== "admin") {
      return res.status(400).json({
        type: "error",
        message: "You cannot remove your own admin role.",
      });
    }
    user.userType = userType;
  }

  if (isActive !== undefined) {
    if (String(id) === String(req.userId) && isActive === false) {
      return res.status(400).json({
        type: "error",
        message: "You cannot disable your own account.",
      });
    }
    user.isActive = Boolean(isActive);
  }

  await user.save();

  const updated = await User.findById(id).select(
    "-password -resetOtp -resetOtpExpires -resetSessionToken -resetSessionExpires -embedding"
  );

  return res.status(200).json({
    type: "success",
    message: "User updated successfully.",
    user: sanitizeUser(updated),
  });
});

module.exports = updateUser;
