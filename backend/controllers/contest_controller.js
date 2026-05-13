const Contest = require('../models/contest_model');
const { fetchAndStoreContests } = require('../services/contest_service');

/**
 * @desc    Get all upcoming contests
 * @route   GET /api/contests
 */
const getContests = async (req, res) => {
  try {
    const { platform } = req.query;
    const filter = { endTime: { $gte: new Date() } };

    if (platform && platform !== 'all') {
      filter.platform = platform;
    }

    const contests = await Contest.find(filter)
      .sort({ startTime: 1 })
      .lean();

    res.json({ success: true, count: contests.length, data: contests });
  } catch (error) {
    console.error('Contest fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contests.' });
  }
};

/**
 * @desc    Refresh contests from Clist API
 * @route   POST /api/contests/refresh
 */
const refreshContests = async (req, res) => {
  try {
    const result = await fetchAndStoreContests();
    res.json({ success: true, message: 'Contests refreshed.', data: result });
  } catch (error) {
    console.error('Contest refresh error:', error);
    res.status(500).json({ success: false, message: error.message || 'Contest refresh failed.' });
  }
};

module.exports = { getContests, refreshContests };
