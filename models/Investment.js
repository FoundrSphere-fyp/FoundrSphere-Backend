const mongoose = require('mongoose');
const { Schema } = mongoose;

const investmentSchema = new Schema({
    investorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
  
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
  
    amount: {
      type: Number
    },
  
    currency: {
      type: String,
      default: "USD"
    },
  
    stage: {
      type: String // pre-seed, seed, series A...
    },
  
    // 🔐 Privacy control
    visibility: {
      type: String,
      enum: ['public', 'private', 'amount_hidden'],
      default: 'public',
      index: true
    },
  
    // 🔥 Useful later for ranking
    convictionLevel: {
      type: Number, // 1–5 (how strong the investor belief is)
      min: 1,
      max: 5
    },
  
    notes: String
  
  }, { timestamps: true });
  
  // 🔥 Prevent duplicate investment entries (same investor + project)
  investmentSchema.index({ investorId: 1, projectId: 1 }, { unique: true });
  
  module.exports = mongoose.model("Investment", investmentSchema);