const asyncWrapper = require("../../middleware/async");
const User = require("../../models/User");
const Project = require("../../models/Project");
const Group = require("../../models/Group");
const GroupPost = require("../../models/GroupPost");
const ChatbotConversation = require("../../models/ChatbotConversation");

const getAdminStats = asyncWrapper(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    disabledUsers,
    foundersCount,
    investorsCount,
    adminsCount,
    projectsCount,
    groupsCount,
    postsCount,
    chatbotConversationsCount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: { $ne: false } }),
    User.countDocuments({ isActive: false }),
    User.countDocuments({ userType: "founder" }),
    User.countDocuments({ userType: "investor" }),
    User.countDocuments({ userType: "admin" }),
    Project.countDocuments(),
    Group.countDocuments(),
    GroupPost.countDocuments(),
    ChatbotConversation.countDocuments(),
  ]);

  return res.status(200).json({
    type: "success",
    stats: {
      totalUsers,
      activeUsers,
      disabledUsers,
      foundersCount,
      investorsCount,
      adminsCount,
      projectsCount,
      groupsCount,
      postsCount,
      chatbotConversationsCount,
    },
  });
});

module.exports = getAdminStats;
