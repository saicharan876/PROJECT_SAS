const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobTitle: { type: String, required: true, trim: true },
    jobDescription: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    customPrompt: { type: String, default: '' },
    rawData: { type: String, default: '' },

    // LLM-generated structured data (stored for reference)
    generatedData: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Generation status tracking
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: { type: String, default: '' },

    // ATS analysis results (if checked)
    atsScore: { type: Number, min: 0, max: 100 },
    atsAnalysis: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
