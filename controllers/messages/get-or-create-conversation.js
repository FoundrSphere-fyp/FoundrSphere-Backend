const Conversation = require("../../models/Conversation");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

const getOrCreateConversation = asyncWrapper(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided', type: 'error' });
    }

    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required', type: 'error' });
    }
    
    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [verification.userId, receiverId] }
    }).populate('participants', 'fullName username');

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [verification.userId, receiverId]
      });
      
      await conversation.populate('participants', 'fullName username');
    }

    return res.status(200).json({
      type: 'success',
      conversation
    });

  } catch (error) {
    console.error('Get/Create conversation error:', error);
    return res.status(500).json({
      message: 'Failed to get or create conversation',
      type: 'error'
    });
  }
});

module.exports = getOrCreateConversation;