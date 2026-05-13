const { fetchGitHubData } = require('../services/github_service');

/**
 * @desc    Fetch GitHub profile and repositories for the CV Builder UI
 * @route   POST /api/cv/fetch-github
 */
const fetchReposForSelection = async (req, res) => {
  try {
    const { githubUrl } = req.body;
    if (!githubUrl) {
      return res.status(400).json({ success: false, message: 'GitHub URL is required.' });
    }

    const githubData = await fetchGitHubData(githubUrl);
    
    res.status(200).json({
      success: true,
      data: githubData
    });
  } catch (error) {
    console.error('Fetch GitHub error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch GitHub data.' });
  }
};

module.exports = { fetchReposForSelection };
