const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");
const GroupEvent = require("../../models/GroupEvent");

const getGroupEvents = asyncWrapper(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided", type: "error" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY);

  const { groupId } = req.body;
  if (!groupId) {
    return res.status(400).json({ type: "error", message: "groupId is required." });
  }

  const events = await GroupEvent.find({ groupId })
    .sort({ startAt: 1 })
    .populate("createdBy", "username fullName avatar")
    .populate("postId", "content")
    .lean();

  return res.status(200).json({
    type: "success",
    events,
  });
});

module.exports = getGroupEvents;
