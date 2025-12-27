const mongoose = require('mongoose');
const { Schema } = mongoose;

const groupPostSchema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  media: [{
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    publicId: {
      type: String,
      required: true, // For Cloudinary deletion if needed
    },
    format: {
      type: String, // jpg, png, mp4, etc.
    },
    width: Number,
    height: Number,
    bytes: Number,
    duration: Number, // For videos
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
  }]
}, { timestamps: true });


module.exports = mongoose.model('GroupPost', groupPostSchema);