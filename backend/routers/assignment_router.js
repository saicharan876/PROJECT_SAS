const express = require('express');
const router = express.Router();
const { solveAssignment } = require('../controllers/assignment_controller');
const authMiddleware = require('../middleware/auth_middleware');

// POST /api/assignments/solve (protected)
router.post('/solve', authMiddleware, solveAssignment);

module.exports = router;
