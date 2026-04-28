const Notification = require("../models/notification.model");
const sendEmailNotification = require("./sendEmailNotification");

const createNotification = async (userId, message, type, emailOptions = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      message,
      type,
    });

    const emailSubjects = {
      JOB_UPDATE: "Job Application Update",
      TEST_RESULT: "Your Test Result",
      APPLICATION_CONFIRMATION: "Application Submitted Successfully",
    };

    const emailResult = await sendEmailNotification(
      userId,
      emailOptions.subject || emailSubjects[type] || "Notification",
      message,
      emailOptions
    );

    if (emailResult) {
      notification.emailStatus = emailResult.status;
      notification.emailedAt = emailResult.emailedAt;
      notification.emailError = emailResult.error;
      await notification.save();
    }

    return notification;
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
};

module.exports = createNotification;
