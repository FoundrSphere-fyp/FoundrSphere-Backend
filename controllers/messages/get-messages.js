const Message = require("../../models/Message");
const Conversation = require("../../models/Conversation");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

const getMessages = asyncWrapper(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided', type: 'error' });
    }

    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: 'Conversation ID is required', type: 'error' });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(verification.userId)) {
      return res.status(403).json({ message: 'Access denied', type: 'error' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'fullName username')
      .populate('receiver', 'fullName username')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      type: 'success',
      messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({
      message: 'Failed to fetch messages',
      type: 'error'
    });
  }
});

module.exports = getMessages;