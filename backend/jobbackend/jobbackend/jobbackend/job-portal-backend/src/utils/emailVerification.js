const nodemailer = require("nodemailer");

let transporter = null;
let transporterVerified = false;

/**
 * Build / reuse the Nodemailer transporter.
 * Returns null when email credentials are not configured.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim();
  const emailService = process.env.EMAIL_SERVICE?.trim();
  const emailHost = process.env.EMAIL_HOST?.trim();

  if (!emailUser || !emailPass) {
    console.warn(
      "[emailVerification] EMAIL_USER / EMAIL_PASS not set – OTP emails disabled."
    );
    return null;
  }

  const config = emailHost
    ? {
        host: emailHost,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: { user: emailUser, pass: emailPass },
      }
    : {
        service: emailService || "gmail",
        auth: { user: emailUser, pass: emailPass },
      };

  transporter = nodemailer.createTransport(config);
  return transporter;
};

/**
 * Generate a cryptographically random 6-digit OTP string.
 */
const generateOtp = () => {
  const min = 100_000;
  const max = 999_999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

/**
 * Send the OTP verification email to the given recipient.
 *
 * @param {string} toEmail   Recipient email address
 * @param {string} toName    Recipient display name
 * @param {string} otp       Plain-text 6-digit OTP
 * @returns {Promise<{status:'sent'|'skipped'|'failed', error?:string}>}
 */
const sendOtpEmail = async (toEmail, toName, otp) => {
  const t = getTransporter();
  if (!t) {
    return { status: "skipped", error: "Email transport not configured" };
  }

  try {
    if (!transporterVerified) {
      await t.verify();
      transporterVerified = true;
    }

    const safeName = (toName || "User").replace(/[<>&"']/g, "");
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">✉️</div>
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:.5px;">
                Verify your email
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;color:#cbd5e1;font-size:15px;">
                Hello <strong style="color:#e2e8f0;">${safeName}</strong>,
              </p>
              <p style="margin:0 0 28px;color:#94a3b8;font-size:14px;line-height:1.6;">
                Use the code below to verify your email address. It expires in
                <strong style="color:#e2e8f0;">10 minutes</strong>.
              </p>
              <!-- OTP Box -->
              <div style="text-align:center;margin:28px 0;">
                <div style="display:inline-block;background:#0f172a;border:2px solid #6366f1;
                            border-radius:12px;padding:20px 48px;">
                  <span style="font-size:42px;font-weight:800;letter-spacing:14px;
                               color:#a5b4fc;font-family:monospace;">
                    ${otp}
                  </span>
                </div>
              </div>
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-align:center;">
                Do not share this code with anyone.
              </p>
              <p style="margin:24px 0 0;color:#64748b;font-size:13px;text-align:center;">
                If you did not create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:20px 40px;text-align:center;
                       border-top:1px solid #1e293b;">
              <p style="margin:0;color:#475569;font-size:12px;">
                © ${new Date().getFullYear()} Job Portal. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text =
      `Hello ${safeName},\n\n` +
      `Your email verification code is: ${otp}\n\n` +
      `This code expires in 10 minutes. Do not share it with anyone.\n\n` +
      `If you did not create an account, ignore this email.`;

    await t.sendMail({
      from: `"Job Portal" <${from}>`,
      to: toEmail,
      subject: "Your email verification code",
      text,
      html,
    });

    return { status: "sent" };
  } catch (err) {
    console.error("[emailVerification] sendMail failed:", err.message);
    return { status: "failed", error: err.message };
  }
};

module.exports = { generateOtp, sendOtpEmail };
