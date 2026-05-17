const asyncWrapper = require("../../../middleware/async");
const GroupPost = require("../../../models/GroupPost");

const getPost = asyncWrapper(async (req, res) => {
  const post = await GroupPost.findById(req.params.id)
    .populate("author", "username email fullName userType isActive")
    .populate("groupId", "name topic visibility")
    .populate("comments.user", "username fullName email")
    .populate("likes", "username fullName")
    .lean();

  if (!post) {
    return res.status(404).json({ type: "error", message: "Post not found." });
  }

  return res.status(200).json({ type: "success", post });
});

module.exports = getPost;
