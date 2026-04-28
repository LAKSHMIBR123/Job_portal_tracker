const User = require("../models/user.model");

let transporter;
let hasLoggedMissingEmailConfig = false;
let hasVerifiedTransporter = false;

const defaultMissingConfigMessage =
  "Email notifications are disabled. Configure EMAIL_USER and EMAIL_PASS plus EMAIL_SERVICE or EMAIL_HOST in .env to enable sending.";

const parseBoolean = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
};

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeEmailDetails = (details = []) => {
  if (!Array.isArray(details)) {
    return [];
  }

  return details.filter(
    (detail) =>
      detail &&
      typeof detail.label === "string" &&
      detail.label.trim() &&
      detail.value !== undefined &&
      detail.value !== null &&
      String(detail.value).trim()
  );
};

const getTransportConfig = () => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim();
  const emailService = process.env.EMAIL_SERVICE?.trim();
  const emailHost = process.env.EMAIL_HOST?.trim() || "smtp.gmail.com";
  const emailPort = Number(process.env.EMAIL_PORT) || 465;
  const emailSecure = process.env.EMAIL_SECURE !== undefined
    ? parseBoolean(process.env.EMAIL_SECURE)
    : emailPort === 465;

  if (!emailUser || !emailPass) {
    return {
      config: null,
      error: defaultMissingConfigMessage,
    };
  }

  // Use explicit host/port for better reliability with Gmail
  return {
    config: {
      host: emailHost,
      port: emailPort,
      secure: emailSecure,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false // Helps in some local environments
      }
    },
    error: null,
  };
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const { config, error } = getTransportConfig();

  if (!config) {
    if (!hasLoggedMissingEmailConfig) {
      console.warn(error || defaultMissingConfigMessage);
      hasLoggedMissingEmailConfig = true;
    }

    return null;
  }

  try {
    const nodemailer = require("nodemailer");

    transporter = nodemailer.createTransport(config);

    return transporter;
  } catch (error) {
    console.warn("Email notifications are disabled:", error.message);
    return null;
  }
};

const sendEmailNotification = async (userId, subject, message, options = {}) => {
  try {
    const emailTransporter = getTransporter();

    if (!emailTransporter) {
      return {
        status: "skipped",
        error: getTransportConfig().error || defaultMissingConfigMessage,
      };
    }

    // Load the user's email so we know where to send the notification.
    const user = await User.findById(userId).select("email name");

    if (!user?.email) {
      return {
        status: "skipped",
        error: "Recipient email address is missing",
      };
    }

    if (!hasVerifiedTransporter) {
      await emailTransporter.verify();
      hasVerifiedTransporter = true;
    }

    const safeName = escapeHtml(user.name || "User");
    const safeMessage = escapeHtml(message);
    const safeEmail = escapeHtml(user.email);
    const detailItems = normalizeEmailDetails(options.details);
    const detailsText = detailItems.length > 0
      ? `\n\nDetails:\n${detailItems
        .map(({ label, value }) => `${label}: ${String(value).trim()}`)
        .join("\n")}`
      : "";
    const detailsHtml = detailItems.length > 0
      ? `
        <div style="margin: 20px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb;">
          <p style="margin: 0 0 12px;"><strong>Application details</strong></p>
          ${detailItems
            .map(
              ({ label, value }) =>
                `<p style="margin: 0 0 8px;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(String(value).trim())}</p>`
            )
            .join("")}
        </div>
      `
      : "";
    const text =
      options.text ||
      (
        `Hello ${user.name || "User"},\n\n` +
        `${message}` +
        `${detailsText}\n\n` +
        `This notification was sent to your account email: ${user.email}\n`
      );
    const html =
      options.html ||
      `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      background-color: #f8fafc;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
          
          <!-- Premium Header -->
          <tr>
            <td align="left" style="background: #1e293b; padding: 40px 40px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="background: #38bdf8; width: 48px; height: 48px; border-radius: 12px; text-align: center; line-height: 48px; margin-bottom: 20px;">
                      <span style="font-size: 24px;">💼</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
                      Application Received
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 16px;">
                      Success! Your journey with us begins now.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 700;">
                Hi ${safeName},
              </h2>
              <p style="margin: 0 0 32px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                Great news! We've successfully received your application. Our hiring team is now reviewing your profile and qualifications for this role.
              </p>

              <!-- Role Summary Card -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 16px 0; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                  Role Details
                </p>
                ${detailItems
                  .map(
                    ({ label, value }) =>
                      `<div style="margin-bottom: 12px;">
                        <span style="color: #475569; font-size: 14px;">${escapeHtml(label)}:</span>
                        <span style="color: #0f172a; font-size: 14px; font-weight: 600; margin-left: 8px;">${escapeHtml(String(value).trim())}</span>
                      </div>`
                  )
                  .join("")}
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                Sent to <strong>${safeEmail}</strong>
              </p>
              <p style="margin: 16px 0 0 0; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Job Portal. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject,
      text,
      html,
    });

    return {
      status: "sent",
      emailedAt: new Date(),
    };
  } catch (error) {
    if (error.code === 'EAUTH') {
      console.error("Email authentication failed. Please check if your EMAIL_PASS is a valid 16-character App Password.");
    } else {
      console.error("Email notification failed:", error.message);
    }

    return {
      status: "failed",
      error: error.message,
      code: error.code
    };
  }
};

module.exports = sendEmailNotification;
