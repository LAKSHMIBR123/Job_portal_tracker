const mongoose = require("mongoose");
const applicationStatuses = ["Applied", "Interview Scheduled", "Offer", "Rejected"];

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const isValidEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const validate = (validator) => {
  return (req, res, next) => {
    const error = validator(req);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    next();
  };
};

const hasAtLeastOneField = (data, fields) =>
  fields.some((field) => data[field] !== undefined);
const getDisallowedFields = (data, allowedFields) =>
  Object.keys(data).filter((field) => !allowedFields.includes(field));

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

const validateQuestionsPayload = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "At least one question is required";
  }

  for (const question of questions) {
    if (!isNonEmptyString(question.question)) return "Each question must have text";
    if (!Array.isArray(question.options) || question.options.length < 2) {
      return "Each question must have at least two options";
    }
    if (question.options.some((option) => !isNonEmptyString(option))) {
      return "Each option must be a non-empty string";
    }
    if (!isNonEmptyString(question.correctAnswer)) {
      return "Each question must have a correct answer";
    }
    if (!question.options.includes(question.correctAnswer)) {
      return "Correct answer must match one of the provided options";
    }
  }

  return null;
};

const validateRegister = validate((req) => {
  const { name, email, password } = req.body;

  if (!isNonEmptyString(name)) return "Name is required";
  if (!isValidEmail(email)) return "Valid email is required";
  if (!isNonEmptyString(password) || password.length < 6) {
    return "Password must be at least 6 characters long";
  }

  return null;
});

const validateLogin = validate((req) => {
  const { email, password } = req.body;

  if (!isValidEmail(email)) return "Valid email is required";
  if (!isNonEmptyString(password)) return "Password is required";

  return null;
});

const validateVerifyOtp = validate((req) => {
  const { email, otp } = req.body;

  if (!isValidEmail(email)) return "Valid email is required";
  if (!isNonEmptyString(otp) || !/^\d{6}$/.test(otp.trim())) {
    return "A 6-digit OTP is required";
  }

  return null;
});

const validateResendOtp = validate((req) => {
  const { email } = req.body;

  if (!isValidEmail(email)) return "Valid email is required";

  return null;
});

const validateProfileUpdate = validate((req) => {
  const { name, email, phone, location, bio, headline } = req.body;

  if (!hasAtLeastOneField(req.body, ["name", "email", "phone", "location", "bio", "headline"])) {
    return "At least one profile field is required";
  }

  if (name !== undefined && !isNonEmptyString(name)) return "Name must be a valid string";
  if (email !== undefined && !isValidEmail(email)) return "Valid email is required";
  if (phone !== undefined && typeof phone !== "string") return "Phone must be a string";
  if (location !== undefined && typeof location !== "string") return "Location must be a string";
  if (bio !== undefined && typeof bio !== "string") return "Bio must be a string";
  if (headline !== undefined && typeof headline !== "string") return "Headline must be a string";

  return null;
});

const validatePasswordChange = validate((req) => {
  const { oldPassword, currentPassword, newPassword } = req.body;
  const previousPassword = oldPassword !== undefined ? oldPassword : currentPassword;

  if (!isNonEmptyString(previousPassword)) return "Old password is required";
  if (!isNonEmptyString(newPassword) || newPassword.length < 6) {
    return "New password must be at least 6 characters long";
  }

  return null;
});

const validateJobPayload = validate((req) => {
  const { title, company, location, salary, description, status, interviewDate, notes } = req.body;

  if (req.method === "POST") {
    if (!isNonEmptyString(title)) return "Job title is required";
    if (!isNonEmptyString(company)) return "Company name is required";
    if (!isNonEmptyString(location)) return "Location is required";
  }

  if (title !== undefined && !isNonEmptyString(title)) return "Job title must be a valid string";
  if (company !== undefined && !isNonEmptyString(company)) return "Company name must be a valid string";
  if (location !== undefined && !isNonEmptyString(location)) return "Location must be a valid string";
  if (salary !== undefined && typeof salary !== "number") return "Salary must be a number";
  if (description !== undefined && typeof description !== "string") return "Description must be a string";
  if (status !== undefined && typeof status !== "string") return "Status must be a string";
  if (interviewDate !== undefined && Number.isNaN(Date.parse(interviewDate))) {
    return "Interview date must be a valid date";
  }
  if (notes !== undefined && typeof notes !== "string") return "Notes must be a string";

  return null;
});

const validateObjectIdParam = (paramName) =>
  validate((req) => {
    if (!isValidObjectId(req.params[paramName])) {
      return `${paramName} is not a valid id`;
    }

    return null;
  });

const validateApplyJob = validate((req) => {
  if (!isValidObjectId(req.body.jobId)) {
    return "Valid jobId is required";
  }

  return null;
});

const validateApplicationUpdate = validate((req) => {
  const allowedFields = req.user?.role === "admin"
    ? adminApplicationFields
    : userApplicationFields;
  const {
    status,
    interviewDate,
    interviewRound,
    interviewNotes,
    notes,
    hrContactName,
    hrContactEmail,
    hrContactPhone,
    followUpDate,
    reminder,
  } = req.body;

  const disallowedFields = getDisallowedFields(req.body, allowedFields);
  if (disallowedFields.length > 0) {
    return `You cannot update these fields: ${disallowedFields.join(", ")}`;
  }

  if (!hasAtLeastOneField(req.body, allowedFields)) {
    return "At least one application field is required";
  }

  if (status !== undefined && !applicationStatuses.includes(status)) {
    return "Invalid application status";
  }

  if (interviewDate !== undefined && Number.isNaN(Date.parse(interviewDate))) {
    return "Interview date must be a valid date";
  }
  if (followUpDate !== undefined && Number.isNaN(Date.parse(followUpDate))) {
    return "Follow-up date must be a valid date";
  }
  if (interviewRound !== undefined && typeof interviewRound !== "string") return "Interview round must be a string";
  if (interviewNotes !== undefined && typeof interviewNotes !== "string") return "Interview notes must be a string";
  if (notes !== undefined && typeof notes !== "string") return "Notes must be a string";
  if (hrContactName !== undefined && typeof hrContactName !== "string") return "HR contact name must be a string";
  if (hrContactEmail !== undefined && !isValidEmail(hrContactEmail)) return "HR contact email must be valid";
  if (hrContactPhone !== undefined && typeof hrContactPhone !== "string") return "HR contact phone must be a string";
  if (reminder !== undefined && typeof reminder !== "string") return "Reminder must be a string";

  return null;
});

const validateApplicationStatus = validate((req) => {
  if (!applicationStatuses.includes(req.body.status)) {
    return "Invalid application status";
  }

  return null;
});

const validateCreateTest = validate((req) => {
  const { title, job, questions, passPercentage } = req.body;

  if (!isNonEmptyString(title)) return "Test title is required";
  if (!isValidObjectId(job)) return "Valid job id is required";
  const questionError = validateQuestionsPayload(questions);
  if (questionError) return questionError;

  if (
    passPercentage !== undefined &&
    (typeof passPercentage !== "number" || passPercentage < 1 || passPercentage > 100)
  ) {
    return "Pass percentage must be a number between 1 and 100";
  }

  return null;
});

const validateUpdateTest = validate((req) => {
  const { title, job, questions, passPercentage } = req.body;

  if (!hasAtLeastOneField(req.body, ["title", "job", "questions", "passPercentage"])) {
    return "At least one test field is required";
  }

  if (title !== undefined && !isNonEmptyString(title)) return "Test title must be a valid string";
  if (job !== undefined && !isValidObjectId(job)) return "Valid job id is required";
  if (questions !== undefined) {
    const questionError = validateQuestionsPayload(questions);
    if (questionError) return questionError;
  }
  if (
    passPercentage !== undefined &&
    (typeof passPercentage !== "number" || passPercentage < 1 || passPercentage > 100)
  ) {
    return "Pass percentage must be a number between 1 and 100";
  }

  return null;
});

const validateSubmitTest = validate((req) => {
  const { testId, answers } = req.body;

  if (!isValidObjectId(testId)) return "Valid testId is required";
  if (!Array.isArray(answers) || answers.length === 0) {
    return "Answers are required";
  }

  return null;
});

module.exports = {
  validateRegister,
  validateLogin,
  validateVerifyOtp,
  validateResendOtp,
  validateProfileUpdate,
  validatePasswordChange,
  validateJobPayload,
  validateObjectIdParam,
  validateApplyJob,
  validateApplicationUpdate,
  validateApplicationStatus,
  validateCreateTest,
  validateUpdateTest,
  validateSubmitTest,
};
