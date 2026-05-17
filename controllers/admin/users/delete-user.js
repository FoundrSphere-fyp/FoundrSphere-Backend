const asyncWrapper = require("../../../middleware/async");
const User = require("../../../models/User");
const FounderProfile = require("../../../models/FounderProfile");
const InvestorProfile = require("../../../models/InvestorProfile");
const Project = require("../../../models/Project");
const Investment = require("../../../models/Investment");
const GroupPost = require("../../../models/GroupPost");
const GroupRequest = require("../../../models/GroupRequest");
const ChatbotConversation = require("../../../models/ChatbotConversation");

const deleteUser = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  if (String(id) === String(req.userId)) {
    return res.status(400).json({
      type: "error",
      message: "You cannot delete your own account.",
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ type: "error", message: "User not found." });
  }

  const ownedProjects = await Project.find({ ownerId: id }).select("_id");
  const projectIds = ownedProjects.map((p) => p._id);

  await Promise.all([
    Investment.deleteMany({ $or: [{ investorId: id }, { projectId: { $in: projectIds } }] }),
    Project.deleteMany({ ownerId: id }),
    GroupPost.deleteMany({ author: id }),
    GroupRequest.deleteMany({ user: id }),
    ChatbotConversation.deleteMany({ userId: id }),
    FounderProfile.deleteOne({ userId: id }),
    InvestorProfile.deleteOne({ userId: id }),
    User.deleteOne({ _id: id }),
  ]);

  return res.status(200).json({
    type: "success",
    message: "User and related data deleted successfully.",
  });
});

module.exports = deleteUser;
