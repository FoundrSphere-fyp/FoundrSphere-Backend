const ChatbotConversation = require("../../models/ChatbotConversation");
const { generateChatReply } = require("../../services/hfChat");
const { computeContextForMessages } = require("../../services/contextWindow");
const {
  queryRelevantMemory,
  storeMessageMemory,
  isMemoryEnabled,
} = require("../../services/chatMemory");

const sendChatbotMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId, message, memoryScope = "conversation" } = req.body;

    if (!message || !conversationId) {
      return res.status(400).json({
        type: "error",
        message: "Conversation ID and message are required",
      });
    }

    const scope =
      memoryScope === "all" ? "all" : "conversation";

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

    const userMessageIndex = conversation.messages.length - 1;

    if (conversation.messages.length === 1) {
      conversation.title =
        message.substring(0, 50) + (message.length > 50 ? "..." : "");
    }

    let memoryHits = 0;
    let memoryContext = "";

    if (isMemoryEnabled()) {
      const memory = await queryRelevantMemory({
        userId,
        conversationId,
        queryText: message,
        memoryScope: scope,
      });
      memoryContext = memory.memoryContext;
      memoryHits = memory.hits;
    }

    let aiResponse = "";
    let contextWindow = null;
    try {
      const result = await generateChatReply(conversation.messages, {
        memoryContext,
      });
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
    const assistantMessageIndex = conversation.messages.length - 1;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    if (isMemoryEnabled()) {
      await Promise.all([
        storeMessageMemory({
          userId,
          conversationId,
          conversationTitle: conversation.title,
          messageIndex: userMessageIndex,
          role: "user",
          content: message,
        }),
        storeMessageMemory({
          userId,
          conversationId,
          conversationTitle: conversation.title,
          messageIndex: assistantMessageIndex,
          role: "assistant",
          content: aiResponse,
        }),
      ]);
    }

    const updatedContext =
      contextWindow ||
      computeContextForMessages(conversation.messages);

    res.json({
      type: "success",
      message: assistantMessage,
      contextWindow: updatedContext,
      memory: {
        enabled: isMemoryEnabled(),
        scope,
        hits: memoryHits,
      },
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
