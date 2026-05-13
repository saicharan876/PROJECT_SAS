const express = require('express');
const router = express.Router();
const {
  getScholarships,
  triggerScrape,
} = require('../controllers/scholarship_controller');
const authMiddleware = require('../middleware/auth_middleware');

// GET /api/scholarships (protected)
// router.get('/', authMiddleware, getScholarships);
router.get('/', getScholarships);

// POST /api/scholarships/scrape (protected — admin/manual trigger)
router.post('/scrape', authMiddleware, triggerScrape);

module.exports = router;
