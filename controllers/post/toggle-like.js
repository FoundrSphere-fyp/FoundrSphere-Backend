const GroupPost = require("../../models/GroupPost");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

const toggleLike = asyncWrapper(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided', type: 'error' });
    }

    // Verify JWT token
    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = verification.id;

    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ 
        type: "error", 
        message: "Post ID is required" 
      });
    }

    // Find the post
    const post = await GroupPost.findById(postId);

    if (!post) {
      return res.status(404).json({ 
        type: "error", 
        message: "Post not found" 
      });
    }

    // Check if user has already liked the post
    const likeIndex = post.likes.indexOf(userId);
    let isLiked;

    if (likeIndex > -1) {
      // User has liked it, so remove the like (unlike)
      post.likes.splice(likeIndex, 1);
      isLiked = false;
    } else {
      // User hasn't liked it, so add the like
      post.likes.push(userId);
      isLiked = true;
    }

    // Save the updated post
    await post.save();

    return res.status(200).json({ 
      type: "success", 
      isLiked: isLiked,
      likesCount: post.likes.length,
      message: isLiked ? "Post liked successfully" : "Post unliked successfully"
    });

  } catch (error) {
    console.log(error);
    return res.status(400).json({ 
      type: "error", 
      message: "Error occurred while toggling like, please try again."
    });
  }
});

module.exports = toggleLike;
