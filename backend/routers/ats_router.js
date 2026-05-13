const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeResume } = require('../controllers/ats_controller');
const authMiddleware = require('../middleware/auth_middleware');

// Configure multer for PDF uploads (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// POST /api/ats/analyze (protected)
router.post('/analyze', authMiddleware, upload.single('resume'), analyzeResume);

module.exports = router;
