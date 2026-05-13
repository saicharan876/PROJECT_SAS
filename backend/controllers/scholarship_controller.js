const Scholarship = require('../models/scholarship_model');
const { scrapeAndStoreScholarships } = require('../services/scraper_service');

/**
 * @desc    Get all scholarships (with optional filters)
 * @route   GET /api/scholarships
 */
const getScholarships = async (req, res) => {
  try {
    const { country, degree, field, search, active } = req.query;
    const filter = {};

    if (country) filter.country = { $regex: country, $options: 'i' };
    if (degree) filter.degreeLevel = degree;
    if (field) filter.fieldOfStudy = { $regex: field, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { provider: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (active !== 'false') {
      filter.isActive = true;
      filter.deadline = { $gte: new Date() };
    }

    const scholarships = await Scholarship.find(filter)
      .sort({ deadline: 1 })
      .lean();

    res.json({ success: true, count: scholarships.length, data: scholarships });
  } catch (error) {
    console.error('Scholarship fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch scholarships.' });
  }
};

/**
 * @desc    Trigger scholarship scraping
 * @route   POST /api/scholarships/scrape
 */
const triggerScrape = async (req, res) => {
  try {
    const result = await scrapeAndStoreScholarships();
    res.json({ success: true, message: 'Scraping completed.', data: result });
  } catch (error) {
    console.error('Scholarship scrape error:', error);
    res.status(500).json({ success: false, message: error.message || 'Scraping failed.' });
  }
};

module.exports = { getScholarships, triggerScrape };
