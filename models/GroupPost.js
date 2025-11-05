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
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('GroupPost', groupPostSchema);
