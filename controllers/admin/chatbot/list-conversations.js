const asyncWrapper = require("../../../middleware/async");
const ChatbotConversation = require("../../../models/ChatbotConversation");
const { parsePagination, paginatedResponse, escapeRegex } = require("../../../utils/adminHelpers");

const listConversations = asyncWrapper(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const filter = {};

  if (req.query.userId) filter.userId = req.query.userId;

  if (req.query.search) {
    const term = escapeRegex(req.query.search.trim());
    filter.$or = [
      { title: new RegExp(term, "i") },
      { "messages.content": new RegExp(term, "i") },
    ];
  }

  const [conversations, total] = await Promise.all([
    ChatbotConversation.find(filter)
      .populate("userId", "username email fullName userType isActive")
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ChatbotConversation.countDocuments(filter),
  ]);

  const items = conversations.map(({ messages, ...c }) => ({
    ...c,
    messageCount: messages?.length || 0,
    lastUserMessage: [...(messages || [])].reverse().find((m) => m.role === "user")?.content || null,
  }));

  return res.status(200).json({
    type: "success",
    ...paginatedResponse(items, total, page, limit),
  });
});

module.exports = listConversations;
