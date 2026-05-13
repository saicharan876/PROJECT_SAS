const express = require('express');
const router = express.Router();
const { signup, login, getProfile } = require('../controllers/auth_controller');
const authMiddleware = require('../middleware/auth_middleware');

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/profile (protected)
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
