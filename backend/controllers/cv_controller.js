const fs = require('fs');
const path = require('path');
const { generateJSON, pointsfromReadme, enhanceText, generatePointsfromDescription } = require('../services/llm_service');
const { fetchGitHubData } = require('../services/github_service');
const { compileLatexToPdf, cleanupJob } = require('../services/latex_service');
const Resume = require('../models/resume_model');
const axios = require('axios');

const CV_SYSTEM_PROMPT = `You are a professional resume writer and LaTeX expert. Given user data (GitHub profile, selected repos, manual info, job target), generate a structured JSON object for a professional CV.

Return ONLY valid JSON matching this schema:
{
  "FULL_NAME": "string",
  "ADDRESS": "string",
  "PHONE": "string",
  "EMAIL": "string",
  "LINKEDIN_USERNAME": "string",
  "GITHUB_USERNAME": "string",
  "EDUCATION": [
    {
      "UNIVERSITY": "string",
      "DATES": "string",
      "DEGREE": "string",
      "LOCATION": "string",
      "COURSEWORK": ["string"]
    }
  ],
  "EXPERIENCE": [
    {
      "COMPANY": "string",
      "DATES": "string",
      "ROLE": "string",
      "LOCATION": "string",
      "BULLETS": ["string"]
    }
  ],
  "PROJECTS": [
    {
      "NAME": "string",
      "TECH": "string",
      "DATES": "string",
      "BULLETS": ["string"]
    }
  ],
  "SKILLS": {
    "LANGUAGES": "string",
    "TOOLS": "string",
    "FRAMEWORKS": "string"
  }
}

IMPORTANT RULES:
- Use strong action verbs for bullet points.
- Tailor all content to the target job title.
- Keep it concise and ATS-friendly.`;

const { escapeLatex } = require('../utils/latex_escape');

const buildLatexSections = (data) => {
  let sections = [];

  // Education Section
  if (data.EDUCATION && data.EDUCATION.length > 0) {
    let edu = "\\section{Education}\n\\resumeSubHeadingListStart\n";
    data.EDUCATION.forEach(e => {
      edu += `  \\resumeSubheading\n    {${escapeLatex(e.UNIVERSITY) || 'N/A'}}{${escapeLatex(e.DATES) || 'N/A'}}\n    {${escapeLatex(e.DEGREE) || 'N/A'}}{${escapeLatex(e.LOCATION) || 'N/A'}}\n`;
      if (e.COURSEWORK && e.COURSEWORK.length > 0) {
        edu += "  \\resumeItemListStart\n";
        e.COURSEWORK.forEach(c => edu += `    \\resumeItem{${escapeLatex(c)}}\n`);
        edu += "  \\resumeItemListEnd\n";
      }
    });
    edu += "\\resumeSubHeadingListEnd\n";
    sections.push(edu);
  }

  // Experience Section
  if (data.EXPERIENCE && data.EXPERIENCE.length > 0) {
    let exp = "\\section{Experience}\n\\resumeSubHeadingListStart\n";
    data.EXPERIENCE.forEach(e => {
      exp += `  \\resumeSubheading\n    {${escapeLatex(e.COMPANY) || 'N/A'}}{${escapeLatex(e.DATES) || 'N/A'}}\n    {${escapeLatex(e.ROLE) || 'N/A'}}{${escapeLatex(e.LOCATION) || 'N/A'}}\n`;
      if (e.BULLETS && e.BULLETS.length > 0) {
        exp += "  \\resumeItemListStart\n";
        e.BULLETS.forEach(b => exp += `    \\resumeItem{${escapeLatex(b)}}\n`);
        exp += "  \\resumeItemListEnd\n";
      }
    });
    exp += "\\resumeSubHeadingListEnd\n";
    sections.push(exp);
  }

  // Projects Section
  if (data.PROJECTS && data.PROJECTS.length > 0) {
    let proj = "\\section{Projects}\n\\resumeSubHeadingListStart\n";
    data.PROJECTS.forEach(p => {
      proj += `  \\resumeProjectHeading\n    {\\textbf{${escapeLatex(p.NAME) || 'N/A'}} $|$ \\emph{${escapeLatex(p.TECH) || 'N/A'}}}{${escapeLatex(p.DATES) || 'N/A'}}\n`;
      if (p.BULLETS && p.BULLETS.length > 0) {
        proj += "  \\resumeItemListStart\n";
        p.BULLETS.forEach(b => proj += `    \\resumeItem{${escapeLatex(b)}}\n`);
        proj += "  \\resumeItemListEnd\n";
      }
    });
    proj += "\\resumeSubHeadingListEnd\n";
    sections.push(proj);
  }

  // Skills Section
  if (data.SKILLS && (data.SKILLS.LANGUAGES || data.SKILLS.TOOLS || data.SKILLS.FRAMEWORKS)) {
    let skills = "\\section{Technical Skills}\n\\begin{itemize}[leftmargin=0.15in, label={}]\n  \\small{\\item{\n";
    if (data.SKILLS.LANGUAGES) skills += `    \\textbf{Languages}{: ${escapeLatex(data.SKILLS.LANGUAGES)}} \\\\\n`;
    if (data.SKILLS.TOOLS) skills += `    \\textbf{Developer Tools}{: ${escapeLatex(data.SKILLS.TOOLS)}} \\\\\n`;
    if (data.SKILLS.FRAMEWORKS) skills += `    \\textbf{Technologies/Frameworks}{: ${escapeLatex(data.SKILLS.FRAMEWORKS)}} \\\\\n`;
    skills += "  }}\n\\end{itemize}\n";
    sections.push(skills);
  }

  return sections.join("\n\\vspace{-16pt}\n");
};

/**
 * @desc    Generate a LaTeX CV using AI and return compiled PDF
 * @route   POST /api/cv/generate
 */
const generateCV = async (req, res) => {
  try {
    const { githubUrl, jobTitle, jobDescription, selectedRepos, manualData, customPrompt } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ success: false, message: 'Job title is required.' });
    }

    // Save initial record
    const resume = await Resume.create({
      user: req.user.id,
      jobTitle,
      jobDescription: jobDescription || '',
      githubUrl: githubUrl || '',
      status: 'processing',
    });

    // Process selected repositories if any
    let processedRepos = [];
    if (selectedRepos && Array.isArray(selectedRepos)) {
      for (const repo of selectedRepos) {
        let bullets = [];
        try {
          // Use pre-generated bullets from the frontend if available
          if (repo.generatedBullets && Array.isArray(repo.generatedBullets) && repo.generatedBullets.length > 0) {
            bullets = repo.generatedBullets;
          } else if (repo.readme) {
            bullets = await pointsfromReadme(repo.readme);
          } else if (repo.description) {
            bullets = await generatePointsfromDescription(repo.description);
          } else {
            bullets = [`Developed and maintained ${repo.name}`];
          }
        } catch (e) {
          bullets = [`Worked on ${repo.name}`];
        }
        processedRepos.push({
          name: repo.name,
          tech: repo.language || 'N/A',
          dates: (repo.created_at && repo.updated_at) 
            ? `${new Date(repo.created_at).getFullYear()} - ${new Date(repo.updated_at).getFullYear()}`
            : 'N/A',
          bullets
        });
      }
    }

    // Enhance manual experience if provided as raw text
    let enhancedExperience = manualData?.experience || '';
    if (typeof enhancedExperience === 'string' && enhancedExperience.trim()) {
      try {
        const bullets = await enhanceText(enhancedExperience);
        enhancedExperience = bullets;
      } catch (e) {
        enhancedExperience = [enhancedExperience];
      }
    }

    // Build user prompt for LLM
    const userPrompt = `
Target Job Title: ${jobTitle}
Job Description: ${jobDescription || 'Not provided'}
Manual Info: ${JSON.stringify(manualData || {})}
GitHub Repos (Processed): ${JSON.stringify(processedRepos)}
Custom Instructions: ${customPrompt || 'None'}

Please organize all this information into the required JSON structure. 
Ensure the "PROJECTS" section uses the Processed GitHub Repos.
If any section (Education, Experience, etc.) is missing in both manual info and github, leave it as an empty array in the JSON.
    `.trim();

    // Generate structured CV data from LLM
    const structuredData = await generateJSON(CV_SYSTEM_PROMPT, userPrompt);

    // FORCE-INJECT the processedRepos bullets into the LLM output
    // The LLM often loses or empties bullet points, so we override them.
    if (processedRepos.length > 0) {
      structuredData.PROJECTS = processedRepos.map((pr, i) => {
        const llmProj = (structuredData.PROJECTS || [])[i] || {};
        return {
          NAME: pr.name || llmProj.NAME || 'Project',
          TECH: pr.tech || llmProj.TECH || 'N/A',
          DATES: pr.dates || llmProj.DATES || 'N/A',
          BULLETS: (pr.bullets && pr.bullets.length > 0) ? pr.bullets : (llmProj.BULLETS || [])
        };
      });
    }

    // Build LaTeX sections
    const latexSections = buildLatexSections(structuredData);

    // Final template data
    const templateData = {
      FULL_NAME: structuredData.FULL_NAME || 'Your Name',
      ADDRESS: structuredData.ADDRESS || 'N/A',
      PHONE: structuredData.PHONE || 'N/A',
      EMAIL: structuredData.EMAIL || 'N/A',
      LINKEDIN_USERNAME: structuredData.LINKEDIN_USERNAME || 'N/A',
      GITHUB_USERNAME: structuredData.GITHUB_USERNAME || 'N/A',
      SECTIONS: latexSections
    };

    // Generate the full LaTeX source for the editor
    const { injectIntoTemplate } = require('../services/latex_service');
    const latexSource = injectIntoTemplate('cv_template.tex', templateData);

    // Update resume record
    resume.generatedData = templateData;

    // Compile to PDF
    try {
      const { pdfPath, jobId } = await compileLatexToPdf('cv_template.tex', templateData);

      resume.status = 'completed';
      await resume.save();

      // Read PDF as base64 so we can also return the LaTeX source
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');

      cleanupJob(jobId);

      res.status(200).json({
        success: true,
        pdfBase64,
        latexSource,
        resumeId: resume._id,
      });
    } catch (latexError) {
      resume.status = 'failed';
      resume.errorMessage = latexError.message;
      await resume.save();

      res.status(200).json({
        success: true,
        message: 'CV data generated but PDF compilation failed.',
        latexSource,
        data: templateData,
        resumeId: resume._id,
        error: latexError.message,
      });
    }
  } catch (error) {
    console.error('CV Generation error:', error);
    res.status(500).json({ success: false, message: error.message || 'CV generation failed.' });
  }
};


/**
 * @desc    Generate 3 bullet points for a project based on its README or description
 * @route   POST /api/cv/generate-bullets
 */
const generateProjectBullets = async (req, res) => {
  try {
    const { repoName, apiUrl, description, readme } = req.body;
    let contentToUse = readme;
    
    // If no readme provided, try fetching it from GitHub API
    if (!contentToUse && apiUrl) {
      try {
        const headers = {};
        if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_pat_here') {
          headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
        }
        const readmeRes = await axios.get(`${apiUrl}/readme`, { headers });
        if (readmeRes.data && readmeRes.data.content) {
          contentToUse = Buffer.from(readmeRes.data.content, 'base64').toString('utf-8');
        }
      } catch (err) {
        console.warn(`Could not fetch README for ${repoName} directly`);
      }
    }

    const { pointsfromReadme, generatePointsfromDescription } = require('../services/llm_service');

    let bullets = [];
    if (contentToUse) {
      bullets = await pointsfromReadme(contentToUse);
    } else if (description) {
      bullets = await generatePointsfromDescription(description);
    } else {
      bullets = [
        `Developed and maintained ${repoName || 'project'}`,
        `Ensured code quality and performance`,
        `Collaborated on features and debugging`
      ];
    }

    res.status(200).json({ success: true, bullets });
  } catch (error) {
    console.error('Project bullets generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate bullets.' });
  }
};

/**
 * @desc    Compile raw LaTeX source to PDF (for the editor)
 * @route   POST /api/cv/compile-latex
 */
const compileLaTeX = async (req, res) => {
  try {
    const { latexSource } = req.body;
    if (!latexSource) {
      return res.status(400).json({ success: false, message: 'LaTeX source is required.' });
    }

    const { compileToPdf, cleanupJob } = require('../services/latex_service');
    const { pdfPath, jobId } = await compileToPdf(latexSource);

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    cleanupJob(jobId);

    res.status(200).json({ success: true, pdfBase64 });
  } catch (error) {
    console.error('LaTeX compile error:', error);
    res.status(500).json({ success: false, message: error.message || 'Compilation failed.' });
  }
};

module.exports = { generateCV, generateProjectBullets, compileLaTeX };
