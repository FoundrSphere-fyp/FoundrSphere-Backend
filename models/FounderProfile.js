const mongoose = require('mongoose');
const { Schema } = mongoose;
const founderProfileSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
  
    startupName: String,
    description: String,
  
    industries: [String],
    stage: String,
  
    fundingNeeded: Number,
    location: String,
  
    businessModel: String,

    founderRole: String,
    commitmentLevel: String,
    desiredCofounderRoles: [String],
    desiredCommitmentLevel: String,

    cofounderPreferenceText: String,
  
    traction: {
      users: Number,
      revenue: Number
    },
  
  
    embedding: [Number]
  
  }, { timestamps: true });
  
  module.exports = mongoose.model("FounderProfile", founderProfileSchema);