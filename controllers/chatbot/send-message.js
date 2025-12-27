const ChatbotConversation = require('../../models/ChatbotConversation');
const axios = require('axios');

const sendChatbotMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId, message, sessionId } = req.body;

    if (!message || !conversationId) {
      return res.status(400).json({
        type: 'error',
        message: 'Conversation ID and message are required'
      });
    }

    // Find conversation
    const conversation = await ChatbotConversation.findOne({
      _id: conversationId,
      userId
    });

    if (!conversation) {
      return res.status(404).json({
        type: 'error',
        message: 'Conversation not found'
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Generate title from first message
    if (conversation.messages.length === 1) {
      conversation.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
    }

    // Call AI model (Python FastAPI)
    let aiResponse = '';
    let newSessionId = sessionId; // Keep existing session_id or get new one
    
    try {
      const requestBody = {
        message,
        conversation_history: conversation.messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        }))
      };

      // Include session_id if it exists (for continuing conversation)
      if (sessionId) {
        requestBody.session_id = sessionId;
      }

      const modelResponse = await axios.post(
        `${process.env.MODEL_API_URL || 'http://localhost:8000'}/chat`,
        requestBody,
        {
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('Model response:', modelResponse.data);
      aiResponse = modelResponse.data.reply || 'Sorry, I could not generate a response.';
      
      // Get session_id from model response (will be present in first response)
      if (modelResponse.data.session_id) {
        newSessionId = modelResponse.data.session_id;
      }
    } catch (error) {
      console.error('Error calling AI model:', error.message);
      aiResponse = 'I apologize, but I am having trouble connecting to my AI backend. Please try again later.';
    }

    // Add assistant message
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.json({
      type: 'success',
      message: {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      },
      sessionId: newSessionId // Send session_id to frontend
    });
  } catch (error) {
    console.error('Error sending chatbot message:', error);
    res.status(500).json({
      type: 'error',
      message: 'Failed to send message'
    });
  }
};

module.exports = sendChatbotMessage;