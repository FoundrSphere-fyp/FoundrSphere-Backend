const Message = require("../../models/Message");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

const markAsRead = asyncWrapper(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided', type: 'error' });
    }

    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { conversationId } = req.body;

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: verification.userId,
        is_read: false
      },
      { is_read: true }
    );

    return res.status(200).json({
      message: 'Messages marked as read',
      type: 'success'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({
      message: 'Failed to mark messages as read',
      type: 'error'
    });
  }
});

module.exports = markAsRead;