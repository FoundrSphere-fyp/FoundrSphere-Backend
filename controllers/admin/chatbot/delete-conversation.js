const asyncWrapper = require("../../../middleware/async");
const ChatbotConversation = require("../../../models/ChatbotConversation");

const deleteConversation = asyncWrapper(async (req, res) => {
  const conversation = await ChatbotConversation.findByIdAndDelete(req.params.id);

  if (!conversation) {
    return res.status(404).json({
      type: "error",
      message: "Conversation not found.",
    });
  }

  return res.status(200).json({
    type: "success",
    message: "Chatbot conversation deleted successfully.",
  });
});

module.exports = deleteConversation;
