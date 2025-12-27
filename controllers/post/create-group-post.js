const GroupPost = require("../../models/GroupPost");
const Group = require("../../models/Group");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

const createGroupPost = asyncWrapper(async (req, res) => {
  try {
    // Verify token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided', 
        type: 'error' 
      });
    }

    // Verify JWT token
    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    const { content, groupId, media } = req.body;

    // Validate: either content or media must be present
    if (!content && (!media || media.length === 0)) {
      return res.status(400).json({
        type: 'error',
        message: 'Post must contain either content or media'
      });
    }

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        type: 'error',
        message: 'Group not found'
      });
    }

    // Create the post
    const post = await GroupPost.create({
      groupId: groupId,
      author: verification.userId,
      content: content || '',
      media: media || []
    });

    // Populate author details
    await post.populate('author', 'username fullName avatar bio userType');

    return res.status(201).json({
      type: 'success',
      message: 'Post created successfully',
      success: true,
      post: post
    });

  } catch (error) {
    console.log(error);
    return res.status(400).json({ 
      type: "error", 
      message: error.message || "Error occurred while creating post, please try again."
    });
  }
});

module.exports = createGroupPost;