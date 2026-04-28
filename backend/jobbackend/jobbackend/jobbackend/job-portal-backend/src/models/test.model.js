const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 2,
        message: "Each question must have at least two options",
      },
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    passPercentage: {
      type: Number,
      default: 60,
      min: 1,
      max: 100,
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one question is required",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Test", testSchema);
