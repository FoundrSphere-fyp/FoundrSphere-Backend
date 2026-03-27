const asyncWrapper = require("../../middleware/async");
const User = require("../../models/User");
const FounderProfile = require("../../models/FounderProfile");
const InvestorProfile = require("../../models/InvestorProfile");

const getAccountSettings = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.userId).select("-password -embedding -resetOtp -resetOtpExpires -resetSessionToken -resetSessionExpires -__v");
  if (!user) {
    return res.status(404).json({ type: "error", message: "User not found." });
  }

  let profile = null;
  if (user.userType === "founder") {
    profile = await FounderProfile.findOne({ userId: user._id }).select("-embedding -__v");
  } else if (user.userType === "investor") {
    profile = await InvestorProfile.findOne({ userId: user._id }).select("-embedding -__v");
  }

  return res.status(200).json({
    type: "success",
    user,
    profile,
  });
});

module.exports = getAccountSettings;
