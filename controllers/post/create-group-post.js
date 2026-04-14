const crypto = require("crypto");
const GroupPost = require("../../models/GroupPost");
const GroupEvent = require("../../models/GroupEvent");
const Group = require("../../models/Group");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

const MEET_BASE = "https://meetup.foundrsphere.com/join/";

function parseHosts(hosts) {
  if (!hosts) return [];
  if (Array.isArray(hosts)) {
    return hosts.map((h) => String(h).trim()).filter(Boolean);
  }
  return String(hosts)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const createGroupPost = asyncWrapper(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "No token provided",
        type: "error",
      });
    }

    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const { content, groupId, media, event } = req.body;

    const eventPayload = event && typeof event === "object" ? event : null;
    const hasEvent =
      eventPayload &&
      String(eventPayload.title || "").trim() &&
      eventPayload.startAt;

    if (!content?.trim() && (!media || media.length === 0) && !hasEvent) {
      return res.status(400).json({
        type: "error",
        message: "Post must contain content, media, or a scheduled event.",
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        type: "error",
        message: "Group not found",
      });
    }

    let postContent = content ? String(content).trim() : "";
    if (!postContent && hasEvent) {
      postContent =
        String(eventPayload.description || "").trim() ||
        `[Event] ${String(eventPayload.title).trim()}`;
    }

    const post = await GroupPost.create({
      groupId: groupId,
      author: verification.userId,
      content: postContent || "",
      media: media || [],
    });

    if (hasEvent) {
      const startAt = new Date(eventPayload.startAt);
      if (Number.isNaN(startAt.getTime())) {
        await GroupPost.findByIdAndDelete(post._id);
        return res.status(400).json({
          type: "error",
          message: "Invalid event start date.",
        });
      }

      let endAt;
      if (eventPayload.endAt) {
        endAt = new Date(eventPayload.endAt);
        if (Number.isNaN(endAt.getTime())) {
          await GroupPost.findByIdAndDelete(post._id);
          return res.status(400).json({
            type: "error",
            message: "Invalid event end date.",
          });
        }
      }

      const isOnline = Boolean(eventPayload.isOnline);
      let meetRoomId = "";
      let meetUrl = "";

      if (isOnline && eventPayload.createMeet) {
        meetRoomId = crypto.randomUUID();
        meetUrl = `${MEET_BASE}?room=${encodeURIComponent(meetRoomId)}`;
      }

      const groupEvent = await GroupEvent.create({
        groupId: group._id,
        postId: post._id,
        createdBy: verification.userId,
        title: String(eventPayload.title).trim(),
        description: String(eventPayload.description || "").trim(),
        hosts: parseHosts(eventPayload.hosts),
        startAt,
        endAt: endAt || undefined,
        isOnline,
        location: isOnline ? "" : String(eventPayload.location || "").trim(),
        meetRoomId,
        meetUrl,
      });

      post.eventId = groupEvent._id;
      await post.save();
    }

    await post.populate("author", "username fullName avatar bio userType");
    if (post.eventId) {
      await post.populate("eventId");
    }

    return res.status(201).json({
      type: "success",
      message: "Post created successfully",
      success: true,
      post: post,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      type: "error",
      message:
        error.message || "Error occurred while creating post, please try again.",
    });
  }
});

module.exports = createGroupPost;
