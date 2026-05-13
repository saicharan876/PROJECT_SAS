const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    provider: { type: String, trim: true, default: 'Unknown' },
    amount: { type: String, default: 'Varies' },
    deadline: { type: Date },
    country: { type: String, default: 'International' },
    degreeLevel: {
      type: String,
      enum: ['Bachelors', 'Masters', 'PhD', 'All', 'Other'],
      default: 'All',
    },
    fieldOfStudy: { type: String, default: 'All Fields' },
    description: { type: String, default: '' },
    url: { type: String, required: true },
    eligibility: [{ type: String }],

    // LLM categorization
    aiTags: [{ type: String }],
    aiSummary: { type: String, default: '' },

    // Scraper metadata
    source: { type: String, default: 'manual' },
    lastScrapedAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for common queries
scholarshipSchema.index({ deadline: 1, isActive: 1 });
scholarshipSchema.index({ country: 1, degreeLevel: 1 });

module.exports = mongoose.model('Scholarship', scholarshipSchema);
