const express = require('express');
const router = express.Router();
const { getContests, refreshContests } = require('../controllers/contest_controller');
const authMiddleware = require('../middleware/auth_middleware');

// GET /api/contests (protected)
router.get('/', authMiddleware, getContests);

// POST /api/contests/refresh (protected — manual refresh)
router.post('/refresh', authMiddleware, refreshContests);

module.exports = router;
