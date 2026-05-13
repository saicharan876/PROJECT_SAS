const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    platform: {
      type: String,
      required: true,
      enum: ['Codeforces', 'LeetCode', 'CodeChef', 'AtCoder', 'HackerRank', 'HackerEarth', 'Other'],
    },
    url: { type: String, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number }, // seconds
    // Clist API reference
    clistId: { type: Number, unique: true, sparse: true },
  },
  { timestamps: true }
);

contestSchema.index({ startTime: 1 });
contestSchema.index({ platform: 1, startTime: 1 });

module.exports = mongoose.model('Contest', contestSchema);
