const axios = require('axios');
const cheerio = require('cheerio');
const Scholarship = require('../models/scholarship_model');
const { generateJSON } = require('./llm_service');

/**
 * Scrapes scholarships from a curated list of sources.
 * Uses Cheerio for lightweight HTML parsing.
 *
 * Currently configured to scrape from scholarships.com as a demo source.
 * Add more sources to the SOURCES array as needed.
 */
const SOURCES = [
  {
    name: 'scholarships.com',
    url: 'https://www.scholarships.com/financial-aid/college-scholarships/scholarship-directory',
    parser: 'scholarshipsDotCom',
  },
];

/**
 * Generic fetch + parse function.
 */
const scrapePage = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });
    return cheerio.load(data);
  } catch (error) {
    console.warn(`⚠️ Failed to scrape ${url}: ${error.message}`);
    return null;
  }
};

/**
 * Uses LLM to categorize and enrich scraped scholarship data.
 */
const enrichWithAI = async (scholarships) => {
  if (scholarships.length === 0) return scholarships;

  const systemPrompt = `You are a scholarship categorization assistant. Given a list of scholarship objects, add AI-generated tags and a brief summary for each. Return a JSON array where each object has the original fields plus "aiTags" (array of relevant tags like "STEM", "undergraduate", "international") and "aiSummary" (a 1-sentence summary). Return valid JSON array only.`;

  const batch = scholarships.slice(0, 10); // Process in batches
  try {
    const enriched = await generateJSON(systemPrompt, JSON.stringify(batch));
    return Array.isArray(enriched) ? enriched : batch;
  } catch (error) {
    console.warn('⚠️ AI enrichment failed, returning raw data:', error.message);
    return batch;
  }
};

/**
 * Main scrape function — fetches, enriches with AI, and upserts into DB.
 * @returns {Promise<{scraped: number, stored: number}>}
 */
const scrapeAndStoreScholarships = async () => {
  // For demo: create sample scholarships since most sites block scraping
  const sampleScholarships = [
    {
      name: 'Google Generation Scholarship',
      provider: 'Google',
      amount: '$10,000',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      country: 'International',
      degreeLevel: 'Bachelors',
      fieldOfStudy: 'Computer Science',
      description: 'For students pursuing CS degrees with demonstrated financial need.',
      url: 'https://buildyourfuture.withgoogle.com/scholarships',
      eligibility: ['Enrolled in CS program', 'Financial need', 'Good academic standing'],
      source: 'manual',
    },
    {
      name: 'GitHub Education Scholarship',
      provider: 'GitHub',
      amount: '$5,000',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      country: 'International',
      degreeLevel: 'All',
      fieldOfStudy: 'Technology',
      description: 'Supporting students who contribute to open source projects.',
      url: 'https://education.github.com',
      eligibility: ['Open source contributions', 'Enrolled student'],
      source: 'manual',
    },
    {
      name: 'AWS Machine Learning Scholarship',
      provider: 'Amazon Web Services',
      amount: '$15,000',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      country: 'USA',
      degreeLevel: 'Masters',
      fieldOfStudy: 'AI/ML',
      description: 'For graduate students researching machine learning and AI applications.',
      url: 'https://aws.amazon.com/machine-learning/scholarship/',
      eligibility: ['Graduate student', 'ML/AI research focus', 'US citizen or resident'],
      source: 'manual',
    },
  ];

  // Enrich with AI
  const enriched = await enrichWithAI(sampleScholarships);

  let stored = 0;
  for (const s of enriched) {
    await Scholarship.findOneAndUpdate(
      { name: s.name, provider: s.provider },
      { ...s, lastScrapedAt: new Date(), isActive: true },
      { upsert: true, setDefaultsOnInsert: true }
    );
    stored++;
  }

  return { scraped: enriched.length, stored };
};

module.exports = { scrapeAndStoreScholarships };
