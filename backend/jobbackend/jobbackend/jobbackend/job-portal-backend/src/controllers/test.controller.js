const Test = require("../models/test.model");
const Result = require("../models/result.model");
const Job = require("../models/job.model");
const createNotification = require("../utils/createNotification");
const asyncHandler = require("../utils/asyncHandler");

// Compare each answer with the correct answer and count the score.
const calculateScore = (questions, answers) => {
  let score = 0;

  for (let i = 0; i < questions.length; i++) {
    if (questions[i].correctAnswer === answers[i]) {
      score++;
    }
  }

  return score;
};

const ensureJobExists = async (jobId) => {
  const job = await Job.findById(jobId);

  return job;
};

const assignTestFields = (test, data) => {
  const fields = ["title", "job", "questions", "passPercentage"];

  fields.forEach((field) => {
    if (data[field] !== undefined) {
      test[field] = data[field];
    }
  });
};

const createTest = asyncHandler(async (req, res) => {
  const { title, job, questions, passPercentage } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    res.status(400);
    throw new Error("At least one question is required to create a test");
  }

  const jobExists = await ensureJobExists(job);

  if (!jobExists) {
    res.status(404);
    throw new Error("Job not found");
  }

  const existingTest = await Test.findOne({ job });

  if (existingTest) {
    res.status(400);
    throw new Error("A separate test already exists for this job. Update it instead.");
  }

  const test = await Test.create({
    title,
    job,
    questions,
    passPercentage,
  });

  res.status(201).json({
    success: true,
    message: "Test created successfully",
    data: {
      test,
    },
  });
});

const updateTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);

  if (!test) {
    res.status(404);
    throw new Error("Test not found");
  }

  const nextJobId = req.body.job ?? test.job;
  const jobExists = await ensureJobExists(nextJobId);

  if (!jobExists) {
    res.status(404);
    throw new Error("Job not found");
  }

  const duplicateTest = await Test.findOne({
    job: nextJobId,
    _id: { $ne: test._id },
  });

  if (duplicateTest) {
    res.status(400);
    throw new Error("Another test is already assigned to this job");
  }

  assignTestFields(test, req.body);
  await test.save();

  res.json({
    success: true,
    message: "Test updated successfully",
    data: {
      test,
    },
  });
});

const deleteTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);

  if (!test) {
    res.status(404);
    throw new Error("Test not found");
  }

  await test.deleteOne();

  res.json({
    success: true,
    message: "Test deleted successfully",
  });
});

const submitTest = asyncHandler(async (req, res) => {
  const { testId, answers } = req.body;

  // 1) Load test
  const test = await Test.findById(testId);

  if (!test) {
    res.status(404);
    throw new Error("Test not found");
  }

  // 2) Validate answers
  if (!Array.isArray(answers) || answers.length !== test.questions.length) {
    res.status(400);
    throw new Error("Answers are required for all questions");
  }

  if (test.questions.length === 0) {
    res.status(400);
    throw new Error("This test has no questions configured");
  }

  // 3) Calculate result
  const totalQuestions = test.questions.length;
  const score = calculateScore(test.questions, answers);
  const percentage = (score / totalQuestions) * 100;
  const passed = percentage >= test.passPercentage;

  // 4) Save result
  const result = await Result.create({
    user: req.user._id,
    test: testId,
    job: test.job,
    score,
    total: totalQuestions,
    passed,
  });

  // 5) Notify user
  await createNotification(
    req.user._id,
    `Your test score is ${score}/${totalQuestions}. Status: ${passed ? "Passed" : "Failed"}`,
    "TEST_RESULT"
  );

  // 6) Send response
  res.status(200).json({
    success: true,
    message: "Test submitted",
    data: {
      score,
      total: totalQuestions,
      passed,
      passPercentage: test.passPercentage,
      result,
    },
  });
});

const getTestByJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  // Get the test for this job
  const test = await Test.findOne({ job: jobId });

  if (!test) {
    res.status(404);
    throw new Error("Test not found for this job");
  }

  // Do not send correct answers to the candidate
  const safeQuestions = test.questions.map((q) => ({
    _id: q._id,
    question: q.question,
    options: q.options,
  }));

  res.json({
    success: true,
    message: "Test fetched",
    data: {
      test: {
        _id: test._id,
        title: test.title,
        job: test.job,
        passPercentage: test.passPercentage,
        questions: safeQuestions,
      },
    },
  });
});

module.exports = {
  createTest,
  updateTest,
  deleteTest,
  submitTest,
  getTestByJob,
};
