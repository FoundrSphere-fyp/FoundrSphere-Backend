const ChatbotConversation = require('../../models/ChatbotConversation');

const deleteChatbotConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    const result = await ChatbotConversation.deleteOne({
      _id: conversationId,
      userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        type: 'error',
        message: 'Conversation not found'
      });
    }

    res.json({
      type: 'success',
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Error deleting chatbot conversation:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to delete conversation'
    });
  }
};

module.exports = deleteChatbotConversation;
