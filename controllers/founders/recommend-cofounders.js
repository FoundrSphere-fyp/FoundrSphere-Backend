const asyncWrapper = require("../../middleware/async");
const User = require("../../models/User");
const FounderProfile = require("../../models/FounderProfile");
const { recommendCofounders } = require("../../services/recommendCofounders");

const stripEmbedding = (doc) => {
  if (!doc) return doc;
  const o = { ...doc };
  delete o.embedding;
  return o;
};

const recommendCofoundersForFounder = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.userId).select("userType");

  if (!user) {
    return res.status(404).json({ type: "error", message: "User not found." });
  }

  if (user.userType !== "founder") {
    return res.status(403).json({
      type: "error",
      message: "Only founders can request cofounder recommendations.",
    });
  }

  const founderProfile = await FounderProfile.findOne({ userId: req.userId });

  if (!founderProfile) {
    return res.status(404).json({
      type: "error",
      message: "Founder profile not found. Complete onboarding first.",
    });
  }

  const ranked = await recommendCofounders(founderProfile, req.userId);

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

module.exports = recommendCofoundersForFounder;
