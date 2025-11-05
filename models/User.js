const mongoose = require('mongoose')
const { Schema } = mongoose;

const users = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address']
   },
  password: {
    type: String
  },
  avatar: {
    type: String,
  },
  fullName: {
    type: String,
  },
  bio: {
    type: String,
  },
  userType: {
    type: String,
    enum: ['founder', 'investor', 'admin'],
    required: true
  },
  resetOtp: {
    type: String,
  },
  
  resetOtpExpires: {
    type: Date,
  },
  
  resetSessionToken: {
    type: String,
  },
  resetSessionExpires: {
    type: Date,
  }
}, { timestamps: true });



module.exports = mongoose.model("User", users);