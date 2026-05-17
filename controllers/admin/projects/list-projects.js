const asyncWrapper = require("../../../middleware/async");
const Project = require("../../../models/Project");
const { parsePagination, paginatedResponse, escapeRegex } = require("../../../utils/adminHelpers");

const listProjects = asyncWrapper(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const filter = {};

  if (req.query.ownerId) filter.ownerId = req.query.ownerId;
  if (req.query.visibility) filter.visibility = req.query.visibility;
  if (req.query.stage) filter.stage = req.query.stage;

  if (req.query.search) {
    const term = escapeRegex(req.query.search.trim());
    const regex = new RegExp(term, "i");
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate("ownerId", "username email fullName userType")
      .select("-embedding")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  return res.status(200).json({
    type: "success",
    ...paginatedResponse(projects, total, page, limit),
  });
});

module.exports = listProjects;
