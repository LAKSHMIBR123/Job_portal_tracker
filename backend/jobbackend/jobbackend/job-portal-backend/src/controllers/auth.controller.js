const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/jwt");
const asyncHandler = require("../utils/asyncHandler");
const { generateOtp, sendOtpEmail } = require("../utils/emailVerification");

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_WINDOW_MS = 15 * 60 * 1000; // 15-minute window
const OTP_RESEND_MAX = 3; // max resends per window

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const buildAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/* ------------------------------------------------------------------ */
/*  REGISTER                                                            */
/* ------------------------------------------------------------------ */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate + hash OTP
  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    isVerified: false,
    otp: hashedOtp,
    otpExpires,
    otpResendCount: 0,
  });

  // Send OTP email (fire-and-forget – don't block registration response)
  sendOtpEmail(normalizedEmail, name, otp).then((result) => {
    if (result.status !== "sent") {
      console.warn("[register] OTP email not delivered:", result.error);
    }
  });

  res.status(201).json({
    success: true,
    message: "Registration successful. Please check your email for the OTP.",
    data: { email: normalizedEmail },
  });
});

/* ------------------------------------------------------------------ */
/*  VERIFY OTP                                                          */
/* ------------------------------------------------------------------ */
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);

  // Fetch fields hidden by `select: false`
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+otp +otpExpires"
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "Email is already verified. Please log in.",
    });
  }

  if (!user.otp || !user.otpExpires) {
    return res.status(400).json({
      success: false,
      message: "No pending OTP. Please request a new one.",
    });
  }

  if (user.otpExpires < new Date()) {
    return res.status(400).json({
      success: false,
      message: "OTP has expired. Please request a new one.",
      code: "OTP_EXPIRED",
    });
  }

  const isMatch = await bcrypt.compare(otp, user.otp);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP. Please try again.",
      code: "INVALID_OTP",
    });
  }

  // Mark verified and clear OTP fields
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  user.otpResendCount = 0;
  user.otpResendWindowStart = undefined;
  await user.save();

  // Issue JWT so the user can be redirected to login immediately
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: "Email verified successfully! You can now log in.",
    data: { token, user: buildAuthUser(user) },
  });
});

/* ------------------------------------------------------------------ */
/*  RESEND OTP                                                          */
/* ------------------------------------------------------------------ */
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+otp +otpExpires"
  );

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "Email is already verified.",
    });
  }

  // Rate-limit: track resends per 15-minute window
  const now = new Date();
  const windowStart = user.otpResendWindowStart;
  const inWindow =
    windowStart && now - windowStart < OTP_RESEND_WINDOW_MS;

  if (inWindow && user.otpResendCount >= OTP_RESEND_MAX) {
    const retryAfterMs =
      OTP_RESEND_WINDOW_MS - (now - windowStart);
    const retryAfterMin = Math.ceil(retryAfterMs / 60_000);
    return res.status(429).json({
      success: false,
      message: `Too many resend attempts. Please wait ${retryAfterMin} minute(s) before retrying.`,
      code: "RESEND_LIMIT",
    });
  }

  // Generate + hash new OTP
  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);

  user.otp = hashedOtp;
  user.otpExpires = otpExpires;
  user.otpResendCount = inWindow ? user.otpResendCount + 1 : 1;
  user.otpResendWindowStart = inWindow ? windowStart : now;
  await user.save();

  const result = await sendOtpEmail(normalizedEmail, user.name, otp);
  if (result.status === "failed") {
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP email. Please try again.",
    });
  }

  res.json({
    success: true,
    message: "A new OTP has been sent to your email.",
  });
});

/* ------------------------------------------------------------------ */
/*  LOGIN                                                               */
/* ------------------------------------------------------------------ */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
      code: "INVALID_CREDENTIALS",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
      code: "INVALID_CREDENTIALS",
    });
  }

  // Block unverified users
  /*
  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message:
        "Please verify your email before logging in. Check your inbox for the OTP.",
      code: "EMAIL_NOT_VERIFIED",
      data: { email: normalizedEmail },
    });
  }
  */

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: "Login successful",
    data: { token, user: buildAuthUser(user) },
  });
});

module.exports = { register, login, verifyOtp, resendOtp };
