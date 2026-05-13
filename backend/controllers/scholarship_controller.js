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

    if (country && country !== 'All') filter.country = { $regex: country, $options: 'i' };
    if (degree && degree !== 'All') filter.degreeLevel = degree;
    if (field) filter.fieldOfStudy = { $regex: field, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { provider: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    // Only filter by active/deadline if explicitly requested
    if (active === 'true') {
      filter.isActive = true;
      filter.deadline = { $gte: new Date() };
    }

    const scholarships = await Scholarship.find(filter)
      .sort({ deadline: 1 })
      .lean();

    // If DB is empty, seed with curated data
    if (scholarships.length === 0 && !search && !country && !degree) {
      await seedScholarships();
      const seeded = await Scholarship.find({}).sort({ deadline: 1 }).lean();
      return res.json({ success: true, count: seeded.length, data: seeded, seeded: true });
    }

    res.json({ success: true, count: scholarships.length, data: scholarships });
  } catch (error) {
    console.error('Scholarship fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch scholarships.' });
  }
};

/**
 * @desc    Trigger scholarship scraping (with fallback to seed data)
 * @route   POST /api/scholarships/scrape
 */
const triggerScrape = async (req, res) => {
  try {
    const result = await scrapeAndStoreScholarships();
    res.json({ success: true, message: 'Scraping completed.', data: result });
  } catch (error) {
    console.warn('Scraping failed, seeding curated data instead:', error.message);
    // Fallback: seed curated scholarships
    try {
      await seedScholarships();
      const count = await Scholarship.countDocuments();
      res.json({ success: true, message: 'Loaded curated scholarship data.', data: { scraped: 0, stored: count } });
    } catch (seedErr) {
      res.status(500).json({ success: false, message: seedErr.message || 'Failed to load scholarships.' });
    }
  }
};

/**
 * Seeds the database with curated, real scholarship data as a fallback.
 */
const seedScholarships = async () => {
  const scholarships = [
    {
      name: 'Google Generation Scholarship',
      provider: 'Google',
      amount: '$10,000',
      deadline: new Date('2026-09-15'),
      country: 'International',
      degreeLevel: 'Bachelors',
      fieldOfStudy: 'Computer Science',
      description: 'For students pursuing CS degrees with demonstrated financial need. Encourages diversity in tech.',
      url: 'https://buildyourfuture.withgoogle.com/scholarships',
      eligibility: ['Enrolled in CS program', 'Financial need', 'Good academic standing'],
      aiTags: ['STEM', 'diversity', 'undergraduate', 'tech'],
      aiSummary: 'Google-funded scholarship for underrepresented CS students worldwide.',
      source: 'curated', isActive: true,
    },
    {
      name: 'Microsoft Scholarship Program',
      provider: 'Microsoft',
      amount: '$5,000',
      deadline: new Date('2026-08-01'),
      country: 'USA',
      degreeLevel: 'Bachelors',
      fieldOfStudy: 'Technology',
      description: 'Awards for students pursuing STEM degrees at accredited institutions in the US.',
      url: 'https://www.microsoft.com/en-us/diversity/programs/scholarships',
      eligibility: ['US citizen or permanent resident', 'Enrolled in STEM program', 'Min 3.0 GPA'],
      aiTags: ['STEM', 'undergraduate', 'USA', 'tech'],
      aiSummary: 'Microsoft supports US-based STEM students with annual scholarship awards.',
      source: 'curated', isActive: true,
    },
    {
      name: 'GitHub Education Scholarship',
      provider: 'GitHub',
      amount: '$2,500',
      deadline: new Date('2026-10-01'),
      country: 'International',
      degreeLevel: 'All',
      fieldOfStudy: 'Computer Science',
      description: 'Supporting open source contributors and students in computer science globally.',
      url: 'https://education.github.com/',
      eligibility: ['Active GitHub profile', 'Currently enrolled student', 'Open source contributions'],
      aiTags: ['open-source', 'global', 'tech', 'developer'],
      aiSummary: 'GitHub rewards students who actively contribute to open-source projects.',
      source: 'curated', isActive: true,
    },
    {
      name: 'AWS AI/ML Scholarship',
      provider: 'Amazon',
      amount: 'Full tuition + stipend',
      deadline: new Date('2026-07-31'),
      country: 'International',
      degreeLevel: 'Masters',
      fieldOfStudy: 'AI & Machine Learning',
      description: 'Covers full tuition and living expenses for students pursuing AI/ML masters degrees.',
      url: 'https://aws.amazon.com/machine-learning/scholarship/',
      eligibility: ['Accepted to accredited Masters program', 'Focus on AI/ML', 'Strong academic record'],
      aiTags: ['AI', 'machine-learning', 'graduate', 'full-ride'],
      aiSummary: 'Amazon-funded full-ride scholarship for AI/ML graduate students.',
      source: 'curated', isActive: true,
    },
    {
      name: 'Meta Fellowship for PhD Students',
      provider: 'Meta',
      amount: '$42,000/year + tuition',
      deadline: new Date('2026-09-30'),
      country: 'International',
      degreeLevel: 'PhD',
      fieldOfStudy: 'Computer Science',
      description: 'A two-year fellowship covering tuition and stipend for PhD students in CS, AI, and related fields.',
      url: 'https://research.facebook.com/fellowship/',
      eligibility: ['PhD candidate', 'Research in CS/AI/ML', 'Published research preferred'],
      aiTags: ['PhD', 'research', 'AI', 'fellowship'],
      aiSummary: 'Meta supports PhD researchers in AI, ML, and CS with substantial multi-year funding.',
      source: 'curated', isActive: true,
    },
    {
      name: 'Infosys InStep Scholarship',
      provider: 'Infosys Foundation',
      amount: '₹5,00,000',
      deadline: new Date('2026-08-15'),
      country: 'India',
      degreeLevel: 'Bachelors',
      fieldOfStudy: 'Engineering',
      description: 'For Indian students from economically weaker backgrounds pursuing engineering degrees.',
      url: 'https://www.infosys.com/infosys-foundation/initiatives/education.html',
      eligibility: ['Indian citizen', 'Engineering student', 'Annual income below ₹5L'],
      aiTags: ['India', 'engineering', 'undergraduate', 'need-based'],
      aiSummary: 'Infosys Foundation supports Indian engineering students with financial need.',
      source: 'curated', isActive: true,
    },
    {
      name: 'Fulbright Scholarship',
      provider: 'US Department of State',
      amount: 'Full funding',
      deadline: new Date('2026-10-15'),
      country: 'International',
      degreeLevel: 'Masters',
      fieldOfStudy: 'All Fields',
      description: 'The Fulbright Program offers fully funded graduate study, research, and teaching opportunities in the US.',
      url: 'https://foreign.fulbrightonline.org/',
      eligibility: ['Non-US citizen', 'Bachelors degree', 'English proficiency'],
      aiTags: ['international', 'full-funding', 'graduate', 'prestigious'],
      aiSummary: 'Prestigious US government-funded program for international graduate students.',
      source: 'curated', isActive: true,
    },
    {
      name: 'DAAD Scholarship for International Students',
      provider: 'DAAD (Germany)',
      amount: '€934/month + tuition',
      deadline: new Date('2026-11-01'),
      country: 'International',
      degreeLevel: 'Masters',
      fieldOfStudy: 'All Fields',
      description: 'Monthly stipend and tuition waiver for international students pursuing Masters in Germany.',
      url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
      eligibility: ['Non-German citizen', 'Bachelors degree', 'Relevant work experience preferred'],
      aiTags: ['Europe', 'Germany', 'graduate', 'monthly-stipend'],
      aiSummary: 'German Academic Exchange Service funds international students for Masters study.',
      source: 'curated', isActive: true,
    },
    {
      name: 'Chevening Scholarship (UK)',
      provider: 'UK Government',
      amount: 'Full funding',
      deadline: new Date('2026-11-05'),
      country: 'International',
      degreeLevel: 'Masters',
      fieldOfStudy: 'All Fields',
      description: 'Fully funded UK government scholarship for future leaders to study a one-year Masters in the UK.',
      url: 'https://www.chevening.org/',
      eligibility: ['Non-UK citizen', 'Work experience 2+ years', 'Return to home country required'],
      aiTags: ['UK', 'leadership', 'full-funding', 'graduate'],
      aiSummary: 'UK government fully funds future leaders for one-year Masters study in Britain.',
      source: 'curated', isActive: true,
    },
    {
      name: 'Rhodes Scholarship',
      provider: 'Rhodes Trust',
      amount: 'Full funding at Oxford',
      deadline: new Date('2026-10-01'),
      country: 'International',
      degreeLevel: 'Masters',
      fieldOfStudy: 'All Fields',
      description: 'The world\'s oldest and most prestigious international scholarship, fully funding study at Oxford.',
      url: 'https://www.rhodeshouse.ox.ac.uk/',
      eligibility: ['Age 19-25', 'Outstanding academic achievement', 'Leadership qualities'],
      aiTags: ['Oxford', 'prestigious', 'full-funding', 'leadership'],
      aiSummary: 'The most prestigious international scholarship, covering all costs at University of Oxford.',
      source: 'curated', isActive: true,
    },
  ];

  for (const s of scholarships) {
    await Scholarship.findOneAndUpdate(
      { name: s.name, provider: s.provider },
      { ...s, lastScrapedAt: new Date() },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
};

module.exports = { getScholarships, triggerScrape };
