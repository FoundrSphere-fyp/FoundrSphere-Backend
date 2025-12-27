const ChatbotConversation = require('../../models/ChatbotConversation');

const createChatbotConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { title } = req.body;

    const conversation = await ChatbotConversation.create({
      userId,
      title: title || 'New Chat',
      messages: []
    });

    res.json({
      type: 'success',
      conversation
    });
  } catch (error) {
    console.error('Error creating chatbot conversation:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to create conversation'
    });
  }
};

module.exports = createChatbotConversation;
