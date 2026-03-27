const asyncWrapper = require("../../middleware/async");
const User = require("../../models/User");
const Project = require("../../models/Project");
const Investment = require("../../models/Investment");

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const createInvestment = asyncWrapper(async (req, res) => {
  const investor = await User.findById(req.userId).select("userType");

  if (!investor) {
    return res.status(404).json({ type: "error", message: "User not found." });
  }

  if (investor.userType !== "investor") {
    return res.status(403).json({
      type: "error",
      message: "Only investors can create investments.",
    });
  }

  const {
    projectId,
    amount,
    currency,
    stage,
    visibility,
    convictionLevel,
    notes,
  } = req.body;

  if (!projectId) {
    return res.status(400).json({
      type: "error",
      message: "Project ID is required.",
    });
  }

  const project = await Project.findById(projectId);

  if (!project || project.visibility !== "public") {
    return res.status(404).json({ type: "error", message: "Project not found." });
  }

  if (String(project.ownerId) === String(req.userId)) {
    return res.status(400).json({
      type: "error",
      message: "You cannot invest in your own project.",
    });
  }

  const allowedVisibility = ["public", "private", "amount_hidden"];
  const vis =
    visibility && allowedVisibility.includes(visibility) ? visibility : "public";

  let conviction = toNumber(convictionLevel);
  if (conviction !== undefined) {
    conviction = Math.min(5, Math.max(1, Math.round(conviction)));
  }

  try {
    const investment = await Investment.create({
      investorId: req.userId,
      projectId: project._id,
      amount: toNumber(amount),
      currency: currency ? String(currency).trim().toUpperCase() : "USD",
      stage: stage ? String(stage).trim() : undefined,
      visibility: vis,
      convictionLevel: conviction,
      notes: notes ? String(notes).trim() : undefined,
    });

    await investment.populate("projectId", "title stage");

    return res.status(201).json({
      type: "success",
      message: "Investment recorded successfully.",
      investment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        type: "error",
        message: "You have already recorded an investment in this project.",
      });
    }
    throw error;
  }
});

module.exports = createInvestment;
