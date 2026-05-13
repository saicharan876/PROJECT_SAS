const express = require('express');
const router = express.Router();
const { generateCV } = require('../controllers/cv_controller');
const { fetchReposForSelection } = require('../controllers/github_controller');
const authMiddleware = require('../middleware/auth_middleware');

// POST /api/cv/generate (protected)
router.post('/generate', authMiddleware, generateCV);

// POST /api/cv/fetch-github (protected)
router.post('/fetch-github', authMiddleware, fetchReposForSelection);

module.exports = router;
