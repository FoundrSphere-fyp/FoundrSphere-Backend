const asyncWrapper = require("../../../middleware/async");
const Group = require("../../../models/Group");
const GroupRequest = require("../../../models/GroupRequest");
const GroupPost = require("../../../models/GroupPost");

const getGroup = asyncWrapper(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate("createdBy", "username email fullName userType")
    .lean();

  if (!group) {
    return res.status(404).json({ type: "error", message: "Group not found." });
  }

  const [memberRequests, postsCount] = await Promise.all([
    GroupRequest.find({ group: group._id })
      .populate("user", "username email fullName userType isActive")
      .sort({ requestedAt: -1 })
      .lean(),
    GroupPost.countDocuments({ groupId: group._id }),
  ]);

  return res.status(200).json({
    type: "success",
    group,
    postsCount,
    memberRequests,
  });
});

module.exports = getGroup;
