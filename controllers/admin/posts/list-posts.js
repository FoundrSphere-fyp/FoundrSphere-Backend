const asyncWrapper = require("../../../middleware/async");
const GroupPost = require("../../../models/GroupPost");
const { parsePagination, paginatedResponse, escapeRegex } = require("../../../utils/adminHelpers");

const listPosts = asyncWrapper(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const filter = {};

  if (req.query.groupId) filter.groupId = req.query.groupId;
  if (req.query.author) filter.author = req.query.author;

  if (req.query.search) {
    const term = escapeRegex(req.query.search.trim());
    filter.content = new RegExp(term, "i");
  }

  const [posts, total] = await Promise.all([
    GroupPost.find(filter)
      .populate("author", "username email fullName userType isActive")
      .populate("groupId", "name topic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    GroupPost.countDocuments(filter),
  ]);

  return res.status(200).json({
    type: "success",
    ...paginatedResponse(posts, total, page, limit),
  });
});

module.exports = listPosts;
