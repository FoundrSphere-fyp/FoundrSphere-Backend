const asyncWrapper = require("../../../middleware/async");
const ChatbotConversation = require("../../../models/ChatbotConversation");

const getConversation = asyncWrapper(async (req, res) => {
  const conversation = await ChatbotConversation.findById(req.params.id)
    .populate("userId", "username email fullName userType isActive")
    .lean();

  if (!conversation) {
    return res.status(404).json({
      type: "error",
      message: "Conversation not found.",
    });
  }

  return res.status(200).json({
    type: "success",
    conversation,
  });
});

module.exports = getConversation;
