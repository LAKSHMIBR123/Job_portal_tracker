const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    status: {
      type: String,
      enum: ["Applied", "Interview Scheduled", "Offer", "Rejected"],
      default: "Applied",
    },
    interviewDate: {
      type: Date,
    },
    interviewRound: {
      type: String,
      trim: true,
    },
    interviewNotes: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    hrContactName: {
      type: String,
      trim: true,
    },
    hrContactEmail: {
      type: String,
      trim: true,
    },
    hrContactPhone: {
      type: String,
      trim: true,
    },
    followUpDate: {
      type: Date,
    },
    reminder: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Removed unique index to allow multiple applications per job
// applicationSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
