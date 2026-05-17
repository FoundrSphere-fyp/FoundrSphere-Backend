const asyncWrapper = require("../../../middleware/async");
const Project = require("../../../models/Project");
const Investment = require("../../../models/Investment");

const getProject = asyncWrapper(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("ownerId", "username email fullName userType isActive")
    .select("-embedding")
    .lean();

  if (!project) {
    return res.status(404).json({ type: "error", message: "Project not found." });
  }

  const investments = await Investment.find({ projectId: project._id })
    .populate("investorId", "username email fullName userType isActive")
    .sort({ createdAt: -1 })
    .lean();

  const fundingSummary = {
    totalInvestments: investments.length,
    totalAmount: 0,
    currencies: {},
    byVisibility: { public: 0, private: 0, amount_hidden: 0 },
    byStage: {},
  };

  for (const inv of investments) {
    const vis = inv.visibility || "public";
    if (fundingSummary.byVisibility[vis] !== undefined) {
      fundingSummary.byVisibility[vis] += 1;
    }

    if (inv.stage) {
      fundingSummary.byStage[inv.stage] =
        (fundingSummary.byStage[inv.stage] || 0) + 1;
    }

    if (inv.amount != null && !Number.isNaN(Number(inv.amount))) {
      fundingSummary.totalAmount += Number(inv.amount);
      const cur = inv.currency || "USD";
      fundingSummary.currencies[cur] =
        (fundingSummary.currencies[cur] || 0) + Number(inv.amount);
    }
  }

  return res.status(200).json({
    type: "success",
    project,
    investments,
    fundingSummary,
  });
});

module.exports = getProject;
