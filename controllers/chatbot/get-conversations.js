const ChatbotConversation = require('../../models/ChatbotConversation');

const getChatbotConversations = async (req, res) => {
  try {
    const userId = req.userId;

    const conversations = await ChatbotConversation.find({ userId })
      .sort({ lastMessageAt: -1 })
      .select('title lastMessageAt messages')
      .lean();

    // Add preview of last message
    const conversationsWithPreview = conversations.map(conv => ({
      _id: conv._id,
      title: conv.title,
      lastMessageAt: conv.lastMessageAt,
      lastMessage: conv.messages.length > 0 
        ? conv.messages[conv.messages.length - 1].content.substring(0, 60) + '...'
        : 'No messages yet',
      messageCount: conv.messages.length
    }));

    res.json({
      type: 'success',
      conversations: conversationsWithPreview
    });
  } catch (error) {
    console.error('Error getting chatbot conversations:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to fetch conversations'
    });
  }
};

module.exports = getChatbotConversations;
