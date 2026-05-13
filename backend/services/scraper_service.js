const puppeteer = require('puppeteer');
const Scholarship = require('../models/scholarship_model');
const { generateJSON } = require('./llm_service');

/**
 * Scrapes scholarships from real public pages using Puppeteer.
 */
const SOURCES = [
  {
    name: 'scholarships.com',
    url: 'https://www.scholarships.com/financial-aid/college-scholarships/scholarship-directory',
    maxItems: 40,
  },
];

const PAGE_LOAD_TIMEOUT_MS = 45000;
const SELECTOR_WAIT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_ITEMS = 30;
const MIN_SCHOLARSHIP_NAME_LENGTH = 12;
const MAX_CONTEXT_LENGTH = 450;
const MAX_CARD_DESCRIPTION_LENGTH = 220;
const MAX_DB_DESCRIPTION_LENGTH = 350;

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

const parseAmount = (text = '') => {
  const match = text.match(/\$\s?[\d,]+(?:\s?-\s?\$\s?[\d,]+)?/);
  return match ? normalizeText(match[0]) : 'Varies';
};

const parseDeadline = (text = '') => {
  const match = text.match(/(?:deadline|apply by|last date)[:\s-]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
  if (!match) return undefined;
  const parsed = new Date(match[1]);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return undefined;
};

const inferDegreeLevel = (text = '') => {
  const value = text.toLowerCase();
  if (value.includes('phd') || value.includes('doctoral')) return 'PhD';
  if (value.includes('master')) return 'Masters';
  if (value.includes('bachelor') || value.includes('undergraduate')) return 'Bachelors';
  return 'All';
};

const inferCountry = (text = '') => {
  const value = text.toLowerCase();
  if (value.includes('united states') || /\busa\b/.test(value) || /\bu\.s\.\b/.test(value)) {
    return 'USA';
  }
  if (value.includes('india')) return 'India';
  if (value.includes('international') || value.includes('worldwide') || value.includes('global')) {
    return 'International';
  }
  return 'International';
};

const inferField = (text = '') => {
  const value = text.toLowerCase();
  if (value.includes('computer') || value.includes('software') || value.includes('tech')) {
    return 'Technology';
  }
  if (value.includes('medical') || value.includes('health')) return 'Medical';
  if (value.includes('engineering')) return 'Engineering';
  if (value.includes('business') || value.includes('management')) return 'Business';
  return 'All Fields';
};

const scrapeSourceWithPuppeteer = async (source) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
    );
    await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: PAGE_LOAD_TIMEOUT_MS });
    await page.waitForSelector('a[href]', { timeout: SELECTOR_WAIT_TIMEOUT_MS });

    const rawItems = await page.evaluate(
      (baseUrl, maxItems, minNameLength, maxContextLength, maxDescriptionLength) => {
      const seen = new Set();
      const rows = [];
      const anchors = Array.from(document.querySelectorAll('a[href]'));

      for (const anchor of anchors) {
        if (rows.length >= maxItems) break;
        const name = (anchor.innerText || '').replace(/\s+/g, ' ').trim();
        if (!name || name.length < minNameLength) continue;

        let href = anchor.getAttribute('href') || '';
        if (!href || href.startsWith('#')) continue;
        if (!/scholarship|award|grant|fellowship|bursary|financial\s*aid/i.test(`${name} ${href}`)) {
          continue;
        }

        try {
          const parsedUrl = new URL(href, baseUrl);
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) continue;
          href = parsedUrl.href;
        } catch {
          continue;
        }

        if (seen.has(href)) continue;
        seen.add(href);

        const container = anchor.closest('article, li, .card, .listing, .item') || anchor.parentElement;
        const contextText = (container ? container.innerText : anchor.innerText) || '';
        const fullText = contextText.replace(/\s+/g, ' ').trim();

        rows.push({
          name,
          url: href,
          context: fullText.slice(0, maxContextLength),
          description: fullText.slice(0, maxDescriptionLength),
        });
      }

      return rows;
      },
      source.url,
      source.maxItems || DEFAULT_MAX_ITEMS,
      MIN_SCHOLARSHIP_NAME_LENGTH,
      MAX_CONTEXT_LENGTH,
      MAX_CARD_DESCRIPTION_LENGTH
    );

    return rawItems.map((item) => {
      const context = normalizeText(item.context || item.description || item.name);
      const name = normalizeText(item.name);
      const url = normalizeText(item.url);

      return {
        name,
        provider: source.name,
        amount: parseAmount(context),
        deadline: parseDeadline(context),
        country: inferCountry(context),
        degreeLevel: inferDegreeLevel(context),
        fieldOfStudy: inferField(context),
        description: normalizeText(item.description || context).slice(0, MAX_DB_DESCRIPTION_LENGTH),
        url,
        eligibility: [],
        source: source.name,
      };
    });
  } finally {
    await browser.close();
  }
};

/**
 * Uses LLM to categorize and enrich scraped scholarship data.
 */
const enrichWithAI = async (scholarships) => {
  if (scholarships.length === 0) return scholarships;

  const systemPrompt = `You are a scholarship categorization assistant. Given a list of scholarship objects, add AI-generated tags and a brief summary for each. Return a JSON array where each object has the original fields plus "aiTags" (array of relevant tags like "STEM", "undergraduate", "international") and "aiSummary" (a 1-sentence summary). Return valid JSON array only.`;

  const enrichedScholarships = [];
  const chunkSize = 10;

  for (let i = 0; i < scholarships.length; i += chunkSize) {
    const chunk = scholarships.slice(i, i + chunkSize);

    try {
      const enrichedChunk = await generateJSON(systemPrompt, JSON.stringify(chunk));
      if (Array.isArray(enrichedChunk)) {
        const aiByUrl = new Map(
          enrichedChunk
            .filter((item) => item && typeof item === 'object' && item.url)
            .map((item) => [normalizeText(item.url), item])
        );
        const aiByName = new Map(
          enrichedChunk
            .filter((item) => item && typeof item === 'object' && item.name)
            .map((item) => [normalizeText(item.name).toLowerCase(), item])
        );

        for (const base of chunk) {
          const ai =
            aiByUrl.get(base.url) ||
            aiByName.get(base.name.toLowerCase()) ||
            {};

          enrichedScholarships.push({
            ...base,
            ...(typeof ai === 'object' ? ai : {}),
            name: base.name,
            url: base.url,
            provider: base.provider,
            source: base.source,
          });
        }
      } else {
        enrichedScholarships.push(...chunk);
      }
    } catch (error) {
      console.warn('⚠️ AI enrichment failed for batch, returning raw data:', error.message);
      enrichedScholarships.push(...chunk);
    }
  }

  return enrichedScholarships;
};

/**
 * Main scrape function — fetches, enriches with AI, and upserts into DB.
 * @returns {Promise<{scraped: number, stored: number}>}
 */
const scrapeAndStoreScholarships = async () => {
  const scrapedScholarships = [];
  for (const source of SOURCES) {
    try {
      const sourceRows = await scrapeSourceWithPuppeteer(source);
      scrapedScholarships.push(...sourceRows);
    } catch (error) {
      console.warn(`⚠️ Failed to scrape ${source.name}: ${error.message}`);
    }
  }

  const deduped = Array.from(
    new Map(
      scrapedScholarships
        .filter((item) => item.name && item.url)
        .map((item) => [JSON.stringify([item.name.toLowerCase(), item.url.toLowerCase()]), item])
    ).values()
  );

  if (!deduped.length) {
    throw new Error('No scholarship data could be scraped from live sources.');
  }

  const enriched = await enrichWithAI(deduped);

  let stored = 0;
  const activeIds = [];
  const sourceNames = SOURCES.map((source) => source.name);
  for (const s of enriched) {
    const updated = await Scholarship.findOneAndUpdate(
      { name: s.name, provider: s.provider },
      { ...s, lastScrapedAt: new Date(), isActive: true },
      { upsert: true, setDefaultsOnInsert: true, new: true }
    );
    if (updated?._id) activeIds.push(updated._id);
    stored++;
  }

  await Scholarship.updateMany(
    { source: { $in: sourceNames }, _id: { $nin: activeIds } },
    { $set: { isActive: false } }
  );

  return { scraped: deduped.length, stored };
};

module.exports = { scrapeAndStoreScholarships };