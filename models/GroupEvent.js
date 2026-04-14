const mongoose = require("mongoose");
const { Schema } = mongoose;

const groupEventSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "GroupPost",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    hosts: [
      {
        type: String,
        trim: true,
      },
    ],
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    /** In-person venue when not online */
    location: {
      type: String,
      trim: true,
      default: "",
    },
    /** Room id for FoundrSphere meet (when online + createMeet) */
    meetRoomId: {
      type: String,
      trim: true,
      default: "",
    },
    /** Full join URL, e.g. https://meetup.foundrsphere.com/join/?room=... */
    meetUrl: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GroupEvent", groupEventSchema);
