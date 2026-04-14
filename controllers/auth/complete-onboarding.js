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

const completeOnboarding = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(404).json({ type: "error", message: "User not found." });
  }

  if (user.userType === "founder") {
    const {
      startupName,
      description,
      industries,
      stage,
      fundingNeeded,
      location,
      businessModel,
      founderRole,
      commitmentLevel,
      desiredCofounderRoles,
      desiredCommitmentLevel,
      cofounderPreferenceText,
      tractionUsers,
      tractionRevenue,
    } = req.body;

    if (!startupName || !description) {
      return res.status(400).json({
        type: "error",
        message: "Startup name and description are required for founders.",
      });
    }

    await FounderProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        startupName: String(startupName).trim(),
        description: String(description).trim(),
        industries: toArray(industries),
        stage: stage ? String(stage).trim() : undefined,
        fundingNeeded: toNumber(fundingNeeded),
        location: location ? String(location).trim() : undefined,
        businessModel: businessModel ? String(businessModel).trim() : undefined,
        founderRole: founderRole ? String(founderRole).trim() : undefined,
        commitmentLevel: commitmentLevel ? String(commitmentLevel).trim() : undefined,
        desiredCofounderRoles: toArray(desiredCofounderRoles),
        desiredCommitmentLevel: desiredCommitmentLevel
          ? String(desiredCommitmentLevel).trim()
          : undefined,
        cofounderPreferenceText: cofounderPreferenceText
          ? String(cofounderPreferenceText).trim()
          : undefined,
        traction: {
          users: toNumber(tractionUsers),
          revenue: toNumber(tractionRevenue),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await trySaveFounderEmbedding(user._id);
  } else if (user.userType === "investor") {
    const {
      firmName,
      investorType,
      preferredIndustries,
      preferredStages,
      checkSizeMin,
      checkSizeMax,
      locations,
      investmentThesis,
    } = req.body;

    if (!firmName || !investorType) {
      return res.status(400).json({
        type: "error",
        message: "Firm name and investor type are required for investors.",
      });
    }

    await InvestorProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        firmName: String(firmName).trim(),
        investorType: String(investorType).trim(),
        preferredIndustries: toArray(preferredIndustries),
        preferredStages: toArray(preferredStages),
        checkSizeMin: toNumber(checkSizeMin),
        checkSizeMax: toNumber(checkSizeMax),
        locations: toArray(locations),
        investmentThesis: investmentThesis ? String(investmentThesis).trim() : undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await trySaveInvestorEmbedding(user._id);
  } else {
    return res.status(400).json({
      type: "error",
      message: "Unsupported user role for onboarding.",
    });
  }

  user.isProfileComplete = true;
  await user.save();

  return res.status(200).json({
    type: "success",
    message: "Onboarding completed successfully.",
    user: {
      userId: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      isProfileComplete: user.isProfileComplete,
    },
  });
});

module.exports = completeOnboarding;
