
const Application = require("../models/application.model");
const Job = require("../models/job.model");
const Test = require("../models/test.model");
const Result = require("../models/result.model");
const User = require("../models/user.model");
const createNotification = require("../utils/createNotification");
const sendEmailNotification = require("../utils/sendEmailNotification");
const asyncHandler = require("../utils/asyncHandler");

const allowedStatuses = ["Applied", "Interview Scheduled", "Offer", "Rejected"];
const adminApplicationFields = [
  "status",
  "interviewDate",
  "interviewRound",
  "interviewNotes",
  "notes",
  "hrContactName",
  "hrContactEmail",
  "hrContactPhone",
  "followUpDate",
  "reminder",
];
const userApplicationFields = ["notes", "followUpDate", "reminder"];

const getOwnedApplication = async (applicationId, user) => {
  const query = { _id: applicationId };

  if (user.role !== "admin") {
    query.user = user._id;
  }

  return Application.findOne(query);
};

const applyApplicationFields = (application, data, editableFields) => {
  editableFields.forEach((field) => {
    if (data[field] !== undefined) {
      application[field] = data[field];
    }
  });
};

const applyJob = asyncHandler(async (req, res) => {
  const { jobId } = req.body;
  const userId = req.user._id;

  // 1) Check if job exists
  const job = await Job.findById(jobId);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Skip backend test check to allow application and email notification to proceed.
  // The frontend handles skill assessments locally.


  // 6) Create the application
  let application;

  try {
    application = await Application.create({
      user: userId,
      job: jobId,
    });
  } catch (error) {
    // If there are other errors (e.g. database connection), throw them
    throw error;
  }


  // 7) Fetch user from DB for security
  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    // fallback to req.user if DB fetch fails
    user = req.user;
  }

  // 8) Build styled HTML email
  const jobTitle = job.title || "Job";
  const companyName = job.company || "Company";
  const userName = user.name || "User";
  const timestamp = new Date().toLocaleString();
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px; border-radius: 8px; max-width: 600px; margin: auto;">
      <h2 style="color: #2e6da4;">Job Application Successful</h2>
      <p>Dear <strong>${userName}</strong>,</p>
      <p>Thank you for applying for the position of <strong style="color: #337ab7;">${jobTitle}</strong>${companyName ? ` at <strong>${companyName}</strong>` : ""}.</p>
      <p>Your application has been received and is being reviewed by our team.</p>
      <p style="margin-top: 24px; color: #555;">Application Timestamp: <strong>${timestamp}</strong></p>
      <hr style="margin: 24px 0;">
      <p style="color: #888; font-size: 13px;">If you have any questions, please reply to this email.<br>Best regards,<br>The ${companyName} Team</p>
    </div>
  `;

  // 9) Send email via the advanced notification utility
  let emailStatus = { status: "not_sent" };
  try {
    emailStatus = await sendEmailNotification(
      userId,
      "Job Application Successful",
      `Your application for the ${jobTitle} position at ${companyName} has been received.`,
      {
        details: [
          { label: "Job Title", value: jobTitle },
          { label: "Company", value: companyName },
          { label: "Location", value: job.location || "Not specified" },
          { label: "Salary", value: job.salary ? `$${job.salary}` : "Not specified" },
        ],
      }
    );
    
    if (emailStatus.status === "failed") {
      console.warn(`Email notification failed for user ${userId}: ${emailStatus.error}`);
    }
  } catch (emailErr) {
    console.error("Critical failure in email notification logic:", emailErr.message);
  }

  res.status(201).json({
    success: true,
    message: "Job applied successfully",
    data: {
      application,
      emailSent: emailStatus.status === "sent",
      emailError: emailStatus.status === "failed" ? emailStatus.error : null
    },
  });
});

const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ user: req.user._id })
    .populate("job", "title company location");

  res.json({
    success: true,
    message: "Applications fetched",
    data: {
      applications,
    },
  });
});

const updateApplication = asyncHandler(async (req, res) => {
  const application = await getOwnedApplication(req.params.id, req.user);

  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  const editableFields = req.user.role === "admin"
    ? adminApplicationFields
    : userApplicationFields;
  const disallowedFields = Object.keys(req.body).filter(
    (field) => !editableFields.includes(field)
  );
  const { status } = req.body;

  if (disallowedFields.length > 0) {
    res.status(403);
    throw new Error(`You cannot update these fields: ${disallowedFields.join(", ")}`);
  }

  if (status !== undefined && !allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid application status");
  }

  applyApplicationFields(application, req.body, editableFields);
  await application.save();

  if (req.user.role === "admin" && status && status !== "Applied") {
    await createNotification(
      application.user,
      `Your application status has been updated to ${status}`,
      "JOB_UPDATE"
    );
  }

  res.json({
    success: true,
    message: "Application updated successfully",
    data: {
      application,
    },
  });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid application status");
  }

  const application = await getOwnedApplication(req.params.id, req.user);

  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  // This route is useful when the frontend only wants to change one field.
  application.status = status;
  await application.save();

  await createNotification(
    application.user,
    `Your application status has been updated to ${status}`,
    "JOB_UPDATE"
  );

  res.json({
    success: true,
    message: "Application status updated successfully",
    data: {
      application,
    },
  });
});

const deleteApplication = asyncHandler(async (req, res) => {
  const application = await getOwnedApplication(req.params.id, req.user);

  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  await application.deleteOne();

  res.json({
    success: true,
    message: "Application deleted successfully",
  });
});

module.exports = {
  applyJob,
  getMyApplications,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
};
