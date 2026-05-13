const fs = require('fs');
const { generateJSON } = require('../services/llm_service');
const { compileLatexToPdf, cleanupJob } = require('../services/latex_service');

const ASSIGNMENT_SYSTEM_PROMPT = `You are an expert academic tutor and LaTeX document author. Given assignment questions, generate comprehensive, well-structured answers.

Return ONLY valid JSON matching this exact schema:
{
  "LOGO_FILENAME": "string (filename of the logo to use, use 'logo.png' if not specified)",
  "COURSE_NAME": "string",
  "STUDENT_NAME": "string (use 'Student' if not provided)",
  "FACULTY_NAME": "string (use 'Faculty' if not provided)",
  "ROLL_NUMBER": "string (use 'N/A' if not provided)",
  "ASSIGNMENT_NUMBER": "string",
  "ASSIGNMENT_CONTENT": "string (complete LaTeX formatted answers)"
}

For ANSWERS_BLOCK, use this LaTeX structure for each question:
\\section*{Question N}
\\textbf{Q:} [question text]

\\textbf{Answer:}
[detailed answer with proper LaTeX formatting]

Use LaTeX features appropriately:
- \\begin{enumerate} or \\begin{itemize} for lists
- \\begin{verbatim} or \\lstlisting for code
- Inline math $...$ and display math \\[...\\] for equations
- \\textbf, \\textit for emphasis
- Clear paragraph breaks between sections

Make answers detailed, accurate, and well-explained. Include step-by-step solutions where appropriate.`;

/**
 * @desc    Solve assignment questions and return compiled PDF
 * @route   POST /api/assignments/solve
 */
const solveAssignment = async (req, res) => {
  try {
    const { subject, title, questions, outputFormat, studentName } = req.body;

    if (!questions) {
      return res.status(400).json({ success: false, message: 'Assignment questions are required.' });
    }

    const userPrompt = `
Subject: ${subject || 'General'}
Assignment Title: ${title || 'Assignment'}
Student Name: ${studentName || 'Student'}
Output Style: ${outputFormat || 'Detailed'}

Questions:
${questions}
    `.trim();

    // Generate answers via LLM
    const assignmentData = await generateJSON(ASSIGNMENT_SYSTEM_PROMPT, userPrompt);

    // Compile to PDF
    try {
      const { pdfPath, jobId } = await compileLatexToPdf('assignment_template.tex', assignmentData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="assignment_${Date.now()}.pdf"`);

      const stream = fs.createReadStream(pdfPath);
      stream.pipe(res);
      stream.on('end', () => cleanupJob(jobId));
    } catch (latexError) {
      res.status(200).json({
        success: true,
        message: 'Answers generated but PDF compilation failed. Ensure pdflatex is installed.',
        data: assignmentData,
        error: latexError.message,
      });
    }
  } catch (error) {
    console.error('Assignment Solver error:', error);
    res.status(500).json({ success: false, message: error.message || 'Assignment solving failed.' });
  }
};

module.exports = { solveAssignment };
