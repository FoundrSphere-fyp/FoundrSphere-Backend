const asyncWrapper = require("../../../middleware/async");
const Group = require("../../../models/Group");

const updateGroup = asyncWrapper(async (req, res) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return res.status(404).json({ type: "error", message: "Group not found." });
  }

  const { name, description, visibility, topic, icon, memberCount } = req.body;

  if (name !== undefined) group.name = String(name).trim();
  if (description !== undefined) group.description = String(description).trim();
  if (visibility !== undefined) group.visibility = String(visibility).trim();
  if (topic !== undefined) group.topic = String(topic).trim();
  if (icon !== undefined) group.icon = String(icon).trim();
  if (memberCount !== undefined) {
    const count = Number(memberCount);
    if (!Number.isNaN(count) && count >= 0) group.memberCount = count;
  }

  await group.save();

  const updated = await Group.findById(group._id)
    .populate("createdBy", "username email fullName userType")
    .lean();

  return res.status(200).json({
    type: "success",
    message: "Group updated successfully.",
    group: updated,
  });
});

module.exports = updateGroup;
