const GroupPost = require("../../models/GroupPost");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

const addComment = asyncWrapper(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided', type: 'error' });
    }

    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = verification.userId || verification.id;

    const { postId, content } = req.body;

    if (!postId || !content?.trim()) {
      return res.status(400).json({
        type: "error",
        message: "Post ID and comment content are required"
      });
    }

    const post = await GroupPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        type: "error",
        message: "Post not found"
      });
    }

    post.comments.push({
      user: userId,
      content: content.trim(),
    });

    await post.save();

    const updatedPost = await GroupPost.findById(postId)
      .populate("author")
      .populate("comments.user", "fullName username userType");

    return res.status(200).json({
      type: "success",
      message: "Comment added successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      type: "error",
      message: "Error occurred while adding comment, please try again."
    });
  }
});

module.exports = addComment;