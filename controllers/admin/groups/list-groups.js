const asyncWrapper = require("../../../middleware/async");
const Group = require("../../../models/Group");
const { parsePagination, paginatedResponse, escapeRegex } = require("../../../utils/adminHelpers");

const listGroups = asyncWrapper(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const filter = {};

  if (req.query.visibility) filter.visibility = req.query.visibility;
  if (req.query.topic) filter.topic = req.query.topic;

  if (req.query.search) {
    const term = escapeRegex(req.query.search.trim());
    const regex = new RegExp(term, "i");
    filter.$or = [{ name: regex }, { description: regex }, { topic: regex }];
  }

  const [groups, total] = await Promise.all([
    Group.find(filter)
      .populate("createdBy", "username email fullName userType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Group.countDocuments(filter),
  ]);

  return res.status(200).json({
    type: "success",
    ...paginatedResponse(groups, total, page, limit),
  });
});

module.exports = listGroups;
