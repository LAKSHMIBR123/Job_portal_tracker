const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
  },
  headline: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  // Email verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String, // hashed OTP
    select: false,
  },
  otpExpires: {
    type: Date,
    select: false,
  },
  otpResendCount: {
    type: Number,
    default: 0,
  },
  otpResendWindowStart: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
