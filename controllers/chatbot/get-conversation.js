const ChatbotConversation = require('../../models/ChatbotConversation');
const { computeContextForMessages } = require('../../services/contextWindow');

const getChatbotConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    const conversation = await ChatbotConversation.findOne({
      _id: conversationId,
      userId
    }).lean();

    if (!conversation) {
      return res.status(404).json({
        type: 'error',
        message: 'Conversation not found'
      });
    }

    res.json({
      type: 'success',
      conversation,
      contextWindow: computeContextForMessages(conversation.messages || []),
    });
  } catch (error) {
    console.error('Error getting chatbot conversation:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to fetch conversation'
    });
  }
};

module.exports = getChatbotConversation;
