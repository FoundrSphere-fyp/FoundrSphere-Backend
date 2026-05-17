const asyncWrapper = require("../../../middleware/async");
const User = require("../../../models/User");
const FounderProfile = require("../../../models/FounderProfile");
const InvestorProfile = require("../../../models/InvestorProfile");
const { sanitizeUser } = require("../../../utils/adminHelpers");

const getUser = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-password -resetOtp -resetOtpExpires -resetSessionToken -resetSessionExpires -embedding"
  );

  if (!user) {
    return res.status(404).json({ type: "error", message: "User not found." });
  }

  const [founderProfile, investorProfile] = await Promise.all([
    FounderProfile.findOne({ userId: user._id }).select("-embedding").lean(),
    InvestorProfile.findOne({ userId: user._id }).select("-embedding").lean(),
  ]);

  return res.status(200).json({
    type: "success",
    user: sanitizeUser(user),
    founderProfile,
    investorProfile,
  });
});

module.exports = getUser;
