const asyncWrapper = require("../../middleware/async");
const Project = require("../../models/Project");
const User = require("../../models/User");
const { trySaveProjectEmbedding } = require("../../services/persistEmbeddings");

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

const createProject = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.userId).select("userType");
  if (!user) {
    return res.status(404).json({ type: "error", message: "User not found." });
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
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      type: "error",
      message: "Title and description are required.",
    });
  }

  const project = await Project.create({
    ownerId: req.userId,
    ownerType: user.userType,
    title: String(title).trim(),
    description: String(description).trim(),
    industries: toArray(industries),
    stage: stage ? String(stage).trim() : undefined,
    metrics: {
      users: toNumber(users, 0),
      revenue: toNumber(revenue, 0),
    },
    tags: toArray(tags),
    links: {
      website: website ? String(website).trim() : undefined,
      github: github ? String(github).trim() : undefined,
      demo: demo ? String(demo).trim() : undefined,
    },
    visibility: visibility === "private" ? "private" : "public",
  });

  await trySaveProjectEmbedding(project._id);

  return res.status(201).json({
    type: "success",
    message: "Project created successfully.",
    project,
  });
});

module.exports = createProject;
