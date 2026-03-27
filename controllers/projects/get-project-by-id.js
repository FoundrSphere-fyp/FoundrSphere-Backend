const asyncWrapper = require("../../middleware/async");
const Project = require("../../models/Project");
const Investment = require("../../models/Investment");

const getProjectById = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id)
    .select("-embedding")
    .populate("ownerId", "fullName username userType avatar");

  if (!project) {
    return res.status(404).json({ type: "error", message: "Project not found." });
  }

  if (project.visibility !== "public") {
    return res.status(404).json({ type: "error", message: "Project not found." });
  }

  const rawInvestments = await Investment.find({
    projectId: project._id,
    $or: [
      { visibility: { $in: ["public", "Public", "amount_hidden", "AMOUNT_HIDDEN"] } },
      { visibility: { $exists: false } },
      { visibility: null },
    ],
  })
    .populate("investorId", "fullName username avatar")
    .sort({ createdAt: -1 })
    .lean();

  const investments = rawInvestments.map((inv) => ({
    _id: inv._id,
    investorId: inv.investorId,
    amount:
      String(inv.visibility || "").toLowerCase() === "amount_hidden" ? null : inv.amount,
    currency: inv.currency || "USD",
    stage: inv.stage,
    visibility: inv.visibility,
    convictionLevel: inv.convictionLevel,
    createdAt: inv.createdAt,
  }));
  console.log(investments);
  console.log(project);

  return res.status(200).json({
    type: "success",
    project,
    investments,
  });
});

module.exports = getProjectById;
