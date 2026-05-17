const asyncWrapper = require("../../../middleware/async");
const GroupPost = require("../../../models/GroupPost");
const GroupEvent = require("../../../models/GroupEvent");

const deletePost = asyncWrapper(async (req, res) => {
  const post = await GroupPost.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ type: "error", message: "Post not found." });
  }

  if (post.eventId) {
    await GroupEvent.deleteOne({ _id: post.eventId });
  }

  await GroupPost.deleteOne({ _id: post._id });

  return res.status(200).json({
    type: "success",
    message: "Post deleted successfully.",
  });
});

module.exports = deletePost;
