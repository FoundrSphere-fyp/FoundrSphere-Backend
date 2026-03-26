const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectSchema = new Schema({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  ownerType: {
    type: String,
    enum: ['founder', 'investor'],
    required: true,
    index: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  industries: {
    type: [String],
    default: []
  },

  stage: {
    type: String, // idea, MVP, launched, scale
    index: true
  },

  metrics: {
    users: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },

  tags: {
    type: [String],
    default: []
  },

  links: {
    website: String,
    github: String,
    demo: String
  },

  // 🔥 Semantic matching
  embedding: {
    type: [Number]
  },

  // 🔥 Optional visibility
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public',
    index: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);