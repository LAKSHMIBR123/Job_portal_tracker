const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/auth.controller");
const {
  validateRegister,
  validateLogin,
  validateVerifyOtp,
  validateResendOtp,
} = require("../middlewares/validation.middleware");

const router = express.Router();

// Rate limiter for resend-otp: max 5 requests per 15 minutes per IP
const resendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many resend attempts. Please wait 15 minutes.",
    code: "RESEND_LIMIT",
  },
});

// Rate limiter for verify-otp: max 10 attempts per 15 minutes per IP
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts. Please wait 15 minutes.",
    code: "VERIFY_LIMIT",
  },
});

router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/verify-otp", verifyOtpLimiter, validateVerifyOtp, authController.verifyOtp);
router.post("/resend-otp", resendOtpLimiter, validateResendOtp, authController.resendOtp);

module.exports = router;
