const ChatbotConversation = require("../../models/ChatbotConversation");
const { generateChatReply } = require("../../services/hfChat");
const { computeContextForMessages } = require("../../services/contextWindow");

const sendChatbotMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId, message } = req.body;

    if (!message || !conversationId) {
      return res.status(400).json({
        type: "error",
        message: "Conversation ID and message are required",
      });
    }

    const conversation = await ChatbotConversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({
        type: "error",
        message: "Conversation not found",
      });
    }

    conversation.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    if (conversation.messages.length === 1) {
      conversation.title =
        message.substring(0, 50) + (message.length > 50 ? "..." : "");
    }

    let aiResponse = "";
    let contextWindow = null;
    try {
      const result = await generateChatReply(conversation.messages);
      aiResponse = result.reply;
      contextWindow = result.contextWindow;
      if (!aiResponse) {
        aiResponse = "Sorry, I could not generate a response.";
      }
    } catch (error) {
      console.error("HF chat completion error:", error.message);
      if (error.response) {
        console.error("HF API details:", error.response?.data || error.status);
      }
      aiResponse =
        "I apologize, but I am having trouble connecting to the AI service. Please try again later.";
    }

    const assistantMessage = {
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
    };

    conversation.messages.push(assistantMessage);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const updatedContext =
      contextWindow ||
      computeContextForMessages(conversation.messages);

    res.json({
      type: "success",
      message: assistantMessage,
      contextWindow: updatedContext,
    });
  } catch (error) {
    console.error("Error sending chatbot message:", error);
    res.status(500).json({
      type: "error",
      message: "Failed to send message",
    });
  }
};

module.exports = sendChatbotMessage;
