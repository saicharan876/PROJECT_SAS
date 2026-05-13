const express = require('express');
const router = express.Router();
const { generateCV, generateProjectBullets, compileLaTeX } = require('../controllers/cv_controller');
const { fetchReposForSelection } = require('../controllers/github_controller');
const authMiddleware = require('../middleware/auth_middleware');

// POST /api/cv/generate (protected)
router.post('/generate', authMiddleware, generateCV);

// POST /api/cv/fetch-github (protected)
router.post('/fetch-github', authMiddleware, fetchReposForSelection);

// POST /api/cv/generate-bullets (protected)
router.post('/generate-bullets', authMiddleware, generateProjectBullets);

// POST /api/cv/compile-latex (protected)
router.post('/compile-latex', authMiddleware, compileLaTeX);

module.exports = router;
