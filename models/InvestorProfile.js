const mongoose = require('mongoose');
const { Schema } = mongoose;
const investorProfileSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    firmName: String,
    investorType: String, // angel, VC
    preferredIndustries: [String],
    preferredStages: [String],
    checkSizeMin: Number,
    checkSizeMax: Number,
    locations: [String],
    investmentThesis: String,
    embedding: [Number]
  
  }, { timestamps: true });
  
  module.exports = mongoose.model("InvestorProfile", investorProfileSchema);