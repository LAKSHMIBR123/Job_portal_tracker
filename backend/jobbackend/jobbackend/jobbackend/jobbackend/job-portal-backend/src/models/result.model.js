const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    score: Number,
    total: Number,
    passed: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", resultSchema);
