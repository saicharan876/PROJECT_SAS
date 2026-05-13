const Task = require('../models/task_model');
const Contest = require('../models/contest_model');
const { generateJSON } = require('../services/llm_service');

const PRIORITIZE_SYSTEM_PROMPT = `You are a productivity AI assistant for students and software engineers. Given a list of tasks and upcoming contests, assign an AI priority score (0-100) and a brief reason to each task.

Consider:
- Deadline urgency (tasks due sooner get higher scores)
- Contest preparation (tasks related to upcoming contests get boosted)
- Category importance (assignments > contests > personal)
- Overdue tasks get maximum priority

Return ONLY valid JSON matching this schema:
{
  "prioritizedTasks": [
    { "taskId": "string", "aiPriorityScore": number, "aiReason": "string (1 sentence)" }
  ]
}`;

/**
 * @desc    Get all tasks for logged-in user
 * @route   GET /api/tasks
 */
const getTasks = async (req, res) => {
  try {
    const { filter: statusFilter } = req.query;
    const query = { user: req.user.id };

    if (statusFilter === 'completed') query.completed = true;
    if (statusFilter === 'pending') query.completed = false;
    if (statusFilter === 'overdue') {
      query.completed = false;
      query.dueDate = { $lt: new Date() };
    }
    if (statusFilter === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: start, $lte: end };
    }
    if (statusFilter === 'week') {
      const start = new Date();
      const end = new Date(); end.setDate(end.getDate() + 7);
      query.dueDate = { $gte: start, $lte: end };
    }

    const tasks = await Task.find(query)
      .populate('linkedContest', 'name platform startTime')
      .sort({ aiPriorityScore: -1, priority: -1, dueDate: 1 })
      .lean();

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error('Task fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 */
const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, category, linkedContest } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const task = await Task.create({
      user: req.user.id,
      title,
      description,
      dueDate,
      priority,
      category,
      linkedContest,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Task create error:', error);
    res.status(500).json({ success: false, message: 'Failed to create task.' });
  }
};

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 */
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update task.' });
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    console.error('Task delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task.' });
  }
};

/**
 * @desc    AI-prioritize tasks
 * @route   POST /api/tasks/prioritize
 */
const prioritizeTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id, completed: false }).lean();

    if (tasks.length === 0) {
      return res.json({ success: true, message: 'No pending tasks to prioritize.', data: [] });
    }

    // Get upcoming contests for context
    const contests = await Contest.find({ startTime: { $gte: new Date() } })
      .sort({ startTime: 1 })
      .limit(10)
      .lean();

    const userPrompt = `
Tasks: ${JSON.stringify(tasks.map((t) => ({ id: t._id, title: t.title, description: t.description, dueDate: t.dueDate, priority: t.priority, category: t.category })))}

Upcoming Contests: ${JSON.stringify(contests.map((c) => ({ name: c.name, platform: c.platform, startTime: c.startTime })))}

Current Date: ${new Date().toISOString()}
    `.trim();

    const result = await generateJSON(PRIORITIZE_SYSTEM_PROMPT, userPrompt);

    // Update tasks with AI scores
    if (result.prioritizedTasks) {
      for (const pt of result.prioritizedTasks) {
        await Task.findByIdAndUpdate(pt.taskId, {
          aiPriorityScore: pt.aiPriorityScore,
          aiReason: pt.aiReason,
        });
      }
    }

    const updatedTasks = await Task.find({ user: req.user.id, completed: false })
      .sort({ aiPriorityScore: -1, priority: -1, dueDate: 1 })
      .lean();

    res.json({ success: true, message: 'Tasks prioritized by AI.', data: updatedTasks });
  } catch (error) {
    console.error('AI Prioritization error:', error);
    res.status(500).json({ success: false, message: error.message || 'Prioritization failed.' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, prioritizeTasks };
