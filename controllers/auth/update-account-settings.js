const asyncWrapper = require("../../middleware/async");
const User = require("../../models/User");
const FounderProfile = require("../../models/FounderProfile");
const InvestorProfile = require("../../models/InvestorProfile");
const { trySaveFounderEmbedding, trySaveInvestorEmbedding } = require("../../services/persistEmbeddings");

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const sanitizeUserForClient = (user) => ({
  userId: user._id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  userType: user.userType,
  isProfileComplete: user.isProfileComplete,
});

const updateAccountSettings = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ type: "error", message: "User not found." });
  }

  const { user: userPayload = {}, profile = {} } = req.body || {};
  const { fullName, username, email, bio, avatar } = userPayload;

  if (username !== undefined) {
    const nextUsername = String(username).trim();
    if (!nextUsername) {
      return res.status(400).json({ type: "error", message: "Username cannot be empty." });
    }
    if (nextUsername !== user.username) {
      const exists = await User.findOne({ username: nextUsername, _id: { $ne: user._id } });
      if (exists) {
        return res.status(400).json({ type: "error", message: "Username already taken." });
      }
      user.username = nextUsername;
    }
  }

  if (email !== undefined) {
    const nextEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nextEmail)) {
      return res.status(400).json({ type: "error", message: "Valid email is required." });
    }
    if (nextEmail !== user.email) {
      const exists = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
      if (exists) {
        return res.status(400).json({ type: "error", message: "Email already registered." });
      }
      user.email = nextEmail;
    }
  }

  if (fullName !== undefined) user.fullName = String(fullName).trim();
  if (bio !== undefined) user.bio = bio ? String(bio).trim() : "";
  if (avatar !== undefined) user.avatar = avatar ? String(avatar).trim() : "";

  await user.save();

  let updatedProfile = null;
  if (user.userType === "founder") {
    const founderUpdate = {
      userId: user._id,
      startupName: profile.startupName ? String(profile.startupName).trim() : undefined,
      description: profile.description ? String(profile.description).trim() : undefined,
      industries: profile.industries !== undefined ? toArray(profile.industries) : undefined,
      stage: profile.stage ? String(profile.stage).trim() : undefined,
      fundingNeeded: toNumber(profile.fundingNeeded),
      location: profile.location ? String(profile.location).trim() : undefined,
      businessModel: profile.businessModel ? String(profile.businessModel).trim() : undefined,
    };

    const traction = {};
    const tractionUsers = toNumber(profile?.traction?.users ?? profile.tractionUsers);
    const tractionRevenue = toNumber(profile?.traction?.revenue ?? profile.tractionRevenue);
    if (tractionUsers !== undefined) traction.users = tractionUsers;
    if (tractionRevenue !== undefined) traction.revenue = tractionRevenue;
    if (Object.keys(traction).length > 0) founderUpdate.traction = traction;

    updatedProfile = await FounderProfile.findOneAndUpdate(
      { userId: user._id },
      founderUpdate,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select("-embedding -__v");
    await trySaveFounderEmbedding(user._id);
  } else if (user.userType === "investor") {
    updatedProfile = await InvestorProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        firmName: profile.firmName ? String(profile.firmName).trim() : undefined,
        investorType: profile.investorType ? String(profile.investorType).trim() : undefined,
        preferredIndustries: profile.preferredIndustries !== undefined ? toArray(profile.preferredIndustries) : undefined,
        preferredStages: profile.preferredStages !== undefined ? toArray(profile.preferredStages) : undefined,
        checkSizeMin: toNumber(profile.checkSizeMin),
        checkSizeMax: toNumber(profile.checkSizeMax),
        locations: profile.locations !== undefined ? toArray(profile.locations) : undefined,
        investmentThesis: profile.investmentThesis ? String(profile.investmentThesis).trim() : undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select("-embedding -__v");
    await trySaveInvestorEmbedding(user._id);
  }

  return res.status(200).json({
    type: "success",
    message: "Account settings updated successfully.",
    user: sanitizeUserForClient(user),
    profile: updatedProfile,
  });
});

module.exports = updateAccountSettings;
