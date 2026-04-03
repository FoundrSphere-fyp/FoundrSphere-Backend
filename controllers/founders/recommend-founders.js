const asyncWrapper = require("../../middleware/async");
const User = require("../../models/User");
const InvestorProfile = require("../../models/InvestorProfile");
const { recommendFounders } = require("../../services/recommendFounders");

const stripEmbedding = (doc) => {
  if (!doc) return doc;
  const o = { ...doc };
  delete o.embedding;
  return o;
};

const recommendFoundersForInvestor = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.userId).select("userType");

  if (!user) {
    return res.status(404).json({ type: "error", message: "User not found." });
  }

  if (user.userType !== "investor") {
    return res.status(403).json({
      type: "error",
      message: "Only investors can request founder recommendations.",
    });
  }

  const investorProfile = await InvestorProfile.findOne({ userId: req.userId });

  if (!investorProfile) {
    return res.status(404).json({
      type: "error",
      message: "Investor profile not found. Complete onboarding first.",
    });
  }

  const ranked = await recommendFounders(investorProfile);

  const userIds = [
    ...new Set(
      ranked
        .map((r) => r.founder?.userId)
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];

  const users = await User.find({ _id: { $in: userIds } }).select(
    "fullName username email"
  );
  const userById = new Map(users.map((u) => [String(u._id), u]));

  const recommendations = ranked.map(({ founder, score, breakdown }) => {
    const f = stripEmbedding(founder);
    const uid = f?.userId ? String(f.userId) : null;
    const founderUser = uid ? userById.get(uid) : null;
    return {
      score,
      breakdown,
      founder: f,
      founderUser: founderUser
        ? {
            fullName: founderUser.fullName,
            username: founderUser.username,
            email: founderUser.email,
          }
        : null,
    };
  });

  return res.status(200).json({
    type: "success",
    recommendations,
  });
});

module.exports = recommendFoundersForInvestor;
