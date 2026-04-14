const asyncWrapper = require("../../middleware/async");
const Project = require("../../models/Project");

const MAX_LIMIT = 30;
const DEFAULT_LIMIT = 10;

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const getPublicProjects = asyncWrapper(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const requestedLimit = toPositiveInt(req.query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    Project.find({ visibility: "public" })
      .select("title description industries stage metrics tags links visibility createdAt ownerType ownerId")
      .populate("ownerId", "fullName username userType avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments({ visibility: "public" }),
  ]);

  return res.status(200).json({
    type: "success",
    projects,
    page,
    limit,
    total,
    hasMore: skip + projects.length < total,
  });
});

module.exports = getPublicProjects;
