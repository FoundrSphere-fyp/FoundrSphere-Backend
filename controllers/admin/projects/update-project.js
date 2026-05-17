const asyncWrapper = require("../../../middleware/async");
const Project = require("../../../models/Project");
const { trySaveProjectEmbedding } = require("../../../services/persistEmbeddings");

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const updateProject = asyncWrapper(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({ type: "error", message: "Project not found." });
  }

  const {
    title,
    description,
    industries,
    stage,
    users,
    revenue,
    tags,
    website,
    github,
    demo,
    visibility,
    ownerType,
  } = req.body;

  if (title !== undefined) project.title = String(title).trim();
  if (description !== undefined) project.description = String(description).trim();
  if (industries !== undefined) project.industries = toArray(industries);
  if (stage !== undefined) project.stage = stage ? String(stage).trim() : "";
  if (tags !== undefined) project.tags = toArray(tags);
  if (visibility !== undefined) project.visibility = visibility === "private" ? "private" : "public";
  if (ownerType !== undefined && ["founder", "investor"].includes(ownerType)) {
    project.ownerType = ownerType;
  }

  if (!project.metrics) project.metrics = {};
  if (users !== undefined) project.metrics.users = toNumber(users, 0);
  if (revenue !== undefined) project.metrics.revenue = toNumber(revenue, 0);

  if (!project.links) project.links = {};
  if (website !== undefined) project.links.website = website ? String(website).trim() : "";
  if (github !== undefined) project.links.github = github ? String(github).trim() : "";
  if (demo !== undefined) project.links.demo = demo ? String(demo).trim() : "";

  await project.save();
  await trySaveProjectEmbedding(project._id);

  const updated = await Project.findById(project._id)
    .populate("ownerId", "username email fullName userType")
    .select("-embedding")
    .lean();

  return res.status(200).json({
    type: "success",
    message: "Project updated successfully.",
    project: updated,
  });
});

module.exports = updateProject;
