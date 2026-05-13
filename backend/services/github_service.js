const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

/**
 * Extracts username from a GitHub URL.
 * @param {string} githubUrl - e.g. "https://github.com/username"
 * @returns {string} username
 */
const extractUsername = (githubUrl) => {
  const cleaned = githubUrl.replace(/\/+$/, '');
  return cleaned.split('/').pop();
};

/**
 * Fetches GitHub user profile and top repositories.
 * @param {string} githubUrl - GitHub profile URL
 * @returns {Promise<object>} { profile, repositories }
 */
const fetchGitHubData = async (githubUrl) => {
  const username = extractUsername(githubUrl);
  const headers = {};

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_pat_here') {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  const [profileRes, reposRes] = await Promise.all([
    axios.get(`${GITHUB_API}/users/${username}`, { headers }),
    axios.get(`${GITHUB_API}/users/${username}/repos`, {
      headers,
      params: { sort: 'updated', per_page: 10, type: 'owner' },
    }),
  ]);

  const profile = {
    name: profileRes.data.name || username,
    bio: profileRes.data.bio || '',
    location: profileRes.data.location || '',
    company: profileRes.data.company || '',
    publicRepos: profileRes.data.public_repos,
    followers: profileRes.data.followers,
    blog: profileRes.data.blog || '',
  };

  const repositories = reposRes.data.map((repo) => ({
    name: repo.name,
    description: repo.description || '',
    language: repo.language || 'N/A',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    url: repo.html_url,
    apiUrl: repo.url,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    topics: repo.topics || [],
    readme: '' // to be populated
  }));

  // Fetch README for the top 2 repos (since template has PROJ_1 and PROJ_2)
  for (let i = 0; i < Math.min(2, repositories.length); i++) {
    try {
      const readmeRes = await axios.get(`${repositories[i].apiUrl}/readme`, { headers });
      if (readmeRes.data && readmeRes.data.content) {
        repositories[i].readme = Buffer.from(readmeRes.data.content, 'base64').toString('utf-8');
      }
    } catch (err) {
      // README might not exist, ignore
      console.warn(`Could not fetch README for ${repositories[i].name}`);
    }
  }

  return { profile, repositories };
};

module.exports = { fetchGitHubData };
