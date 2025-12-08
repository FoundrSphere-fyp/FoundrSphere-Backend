const Conversation = require("../../models/Conversation");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

const getConversations = asyncWrapper(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided', type: 'error' });
    }

    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const conversations = await Conversation.find({
      participants: verification.userId
    })
      .populate('participants', 'fullName username')
      .sort({ lastMessageAt: -1 });

    return res.status(200).json({
      type: 'success',
      conversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({
      message: 'Failed to fetch conversations',
      type: 'error'
    });
  }
});

module.exports = getConversations;