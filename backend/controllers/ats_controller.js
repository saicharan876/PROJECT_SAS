const pdfParse = require('pdf-parse');
const { generateJSON } = require('../services/llm_service');

const ATS_SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the provided resume text against the given job description.

Return ONLY valid JSON matching this exact schema:
{
  "score": number (0-100, overall ATS compatibility score),
  "missingKeywords": ["string"] (keywords from the job description NOT found in the resume),
  "presentKeywords": ["string"] (keywords from the job description found in the resume),
  "structuralFeedback": [
    { "aspect": "string", "status": "pass|fail|warning", "message": "string" }
  ],
  "recommendations": ["string"] (actionable improvement suggestions),
  "summary": "string (2-3 sentence overall assessment)"
}

Scoring criteria:
- Keyword match: 40% weight
- Structure & formatting: 20% weight
- Relevance to job description: 25% weight
- Impact statements & metrics: 15% weight

Check for: contact info, professional summary, skills section, quantified achievements, relevant experience, education, consistent formatting.`;

/**
 * @desc    Analyze resume against job description using AI
 * @route   POST /api/ats/analyze
 */
const analyzeResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF resume.' });
    }
    if (!jobDescription) {
      return res.status(400).json({ success: false, message: 'Job description is required.' });
    }

    // Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract enough text from the PDF. Ensure it is not image-based.',
      });
    }

    // Send to LLM for analysis
    const userPrompt = `
=== RESUME TEXT ===
${resumeText}

=== JOB DESCRIPTION ===
${jobDescription}
    `.trim();

    const analysis = await generateJSON(ATS_SYSTEM_PROMPT, userPrompt);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('ATS Analysis error:', error);
    res.status(500).json({ success: false, message: error.message || 'ATS analysis failed.' });
  }
};

module.exports = { analyzeResume };
