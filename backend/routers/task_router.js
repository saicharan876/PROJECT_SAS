const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  prioritizeTasks,
} = require('../controllers/task_controller');
const authMiddleware = require('../middleware/auth_middleware');

// All task routes are protected
router.use(authMiddleware);

// GET    /api/tasks            — List all tasks for logged-in user
router.get('/', getTasks);

// POST   /api/tasks            — Create a new task
router.post('/', createTask);

// PUT    /api/tasks/:id        — Update a task
router.put('/:id', updateTask);

// DELETE /api/tasks/:id        — Delete a task
router.delete('/:id', deleteTask);

// POST   /api/tasks/prioritize — AI-prioritize tasks
router.post('/prioritize', prioritizeTasks);

module.exports = router;
