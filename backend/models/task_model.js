const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: [true, 'Task title is required'], trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date },
    priority: {
      type: Number,
      enum: [1, 2, 3], // 1=low, 2=medium, 3=urgent
      default: 2,
    },
    category: {
      type: String,
      enum: ['assignment', 'contest', 'personal', 'scholarship'],
      default: 'personal',
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },

    // AI prioritization
    aiPriorityScore: { type: Number, min: 0, max: 100 },
    aiReason: { type: String, default: '' },

    // Optional link to a contest
    linkedContest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest' },
  },
  { timestamps: true }
);

// Auto-set completedAt
taskSchema.pre('save', function () {
  if (this.isModified('completed') && this.completed) {
    this.completedAt = new Date();
  }
});

taskSchema.index({ user: 1, completed: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
