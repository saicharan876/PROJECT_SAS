const axios = require('axios');
const Contest = require('../models/contest_model');

const CLIST_API = 'https://clist.by/api/v4/contest/';

// Platform name mapping from Clist to our enum
const PLATFORM_MAP = {
  'codeforces.com': 'Codeforces',
  'leetcode.com': 'LeetCode',
  'codechef.com': 'CodeChef',
  'atcoder.jp': 'AtCoder',
  'hackerrank.com': 'HackerRank',
  'hackerearth.com': 'HackerEarth',
};

/**
 * Maps a Clist resource host to our platform enum.
 */
const mapPlatform = (host) => {
  for (const [domain, name] of Object.entries(PLATFORM_MAP)) {
    if (host.includes(domain)) return name;
  }
  return 'Other';
};

/**
 * Fetches upcoming contests from Clist API and upserts into DB.
 * @returns {Promise<{inserted: number, updated: number}>}
 */
const fetchAndStoreContests = async () => {
  const apiKey = process.env.CLIST_API_KEY;
  const username = process.env.CLIST_USERNAME;

  if (!apiKey || apiKey === 'your_clist_api_key_here') {
    throw new Error('CLIST_API_KEY not configured. Set it in .env');
  }

  const now = new Date().toISOString();
  const res = await axios.get(CLIST_API, {
    headers: { Authorization: `ApiKey ${username}:${apiKey}` },
    params: {
      start__gte: now,
      order_by: 'start',
      limit: 100,
    },
  });

  const contests = res.data.objects || [];
  let inserted = 0;
  let updated = 0;

  for (const c of contests) {
    const contestData = {
      name: c.event,
      platform: mapPlatform(c.resource?.name || c.host || ''),
      url: c.href,
      startTime: new Date(c.start),
      endTime: new Date(c.end),
      duration: c.duration,
      clistId: c.id,
    };

    const result = await Contest.findOneAndUpdate(
      { clistId: c.id },
      contestData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (result.createdAt && result.createdAt.getTime() === result.updatedAt.getTime()) {
      inserted++;
    } else {
      updated++;
    }
  }

  return { inserted, updated, total: contests.length };
};

module.exports = { fetchAndStoreContests };
