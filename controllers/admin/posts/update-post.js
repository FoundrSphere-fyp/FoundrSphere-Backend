const asyncWrapper = require("../../../middleware/async");
const GroupPost = require("../../../models/GroupPost");

const updatePost = asyncWrapper(async (req, res) => {
  const post = await GroupPost.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ type: "error", message: "Post not found." });
  }

  const { content } = req.body;

  if (content !== undefined) {
    post.content = String(content);
  }

  await post.save();

  const updated = await GroupPost.findById(post._id)
    .populate("author", "username email fullName userType")
    .populate("groupId", "name topic")
    .lean();

  return res.status(200).json({
    type: "success",
    message: "Post updated successfully.",
    post: updated,
  });
});

module.exports = updatePost;
