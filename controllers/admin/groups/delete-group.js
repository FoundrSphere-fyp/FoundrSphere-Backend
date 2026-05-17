const asyncWrapper = require("../../../middleware/async");
const Group = require("../../../models/Group");
const GroupPost = require("../../../models/GroupPost");
const GroupRequest = require("../../../models/GroupRequest");
const GroupEvent = require("../../../models/GroupEvent");

const deleteGroup = asyncWrapper(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return res.status(404).json({ type: "error", message: "Group not found." });
  }

  await Promise.all([
    GroupPost.deleteMany({ groupId: group._id }),
    GroupEvent.deleteMany({ groupId: group._id }),
    GroupRequest.deleteMany({ group: group._id }),
    Group.deleteOne({ _id: group._id }),
  ]);

  return res.status(200).json({
    type: "success",
    message: "Group and related posts/events deleted successfully.",
  });
});

module.exports = deleteGroup;
