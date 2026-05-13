const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('crypto');
const { escapeLatexObject } = require('../utils/latex_escape');
const { cleanupTempFiles } = require('../utils/file_cleanup');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const TEMP_DIR = path.join(__dirname, '..', 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Generates a unique job ID for temp file naming.
 */
const generateJobId = () => {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

/**
 * Reads a LaTeX template and replaces {{PLACEHOLDER}} with data values.
 * @param {string} templateName - Template filename (e.g., 'cv_template.tex')
 * @param {object} data - Key-value pairs matching {{KEY}} placeholders.
 * @returns {string} Populated LaTeX source.
 */
const injectIntoTemplate = (templateName, data) => {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  let template = fs.readFileSync(templatePath, 'utf-8');

  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    let safeValue = typeof value === 'string' ? value : String(value || '');
    
    // Escape LaTeX special characters for all fields EXCEPT pre-formatted SECTIONS
    if (key !== 'SECTIONS') {
        safeValue = escapeLatexObject(safeValue);
    }
    
    template = template.split(placeholder).join(safeValue);
  }

  return template;
};

/**
 * Compiles a .tex string to PDF using pdflatex.
 * @param {string} texContent - Full LaTeX source code.
 * @returns {Promise<string>} Absolute path to the compiled PDF.
 */
const compileToPdf = (texContent) => {
  return new Promise((resolve, reject) => {
    const jobId = generateJobId();
    const texPath = path.join(TEMP_DIR, `${jobId}.tex`);
    const pdfPath = path.join(TEMP_DIR, `${jobId}.pdf`);

    fs.writeFileSync(texPath, texContent, 'utf-8');

    // Run pdflatex twice for cross-references
    const cmd = `pdflatex -interaction=nonstopmode -output-directory="${TEMP_DIR}" "${texPath}"`;

    exec(cmd, { timeout: 120000 }, (error, stdout, stderr) => {
      // Run second pass
      exec(cmd, { timeout: 120000 }, (error2) => {
        if (!fs.existsSync(pdfPath)) {
          // Cleanup on failure
          cleanupTempFiles(path.join(TEMP_DIR, jobId));
          return reject(
            new Error(`PDF compilation failed. Check LaTeX syntax.\n${stderr || stdout || ''}`)
          );
        }
        resolve({ pdfPath, jobId });
      });
    });
  });
};

/**
 * Full pipeline: inject data into template → compile → return PDF path.
 * @param {string} templateName - Template filename.
 * @param {object} data - Placeholder data.
 * @returns {Promise<{pdfPath: string, jobId: string}>}
 */
const compileLatexToPdf = async (templateName, data) => {
  const texContent = injectIntoTemplate(templateName, data);
  return compileToPdf(texContent);
};

/**
 * Cleans up all temp files for a given job ID.
 */
const cleanupJob = (jobId) => {
  cleanupTempFiles(path.join(TEMP_DIR, jobId));
  // Also remove the PDF itself
  const pdfPath = path.join(TEMP_DIR, `${jobId}.pdf`);
  if (fs.existsSync(pdfPath)) {
    fs.unlinkSync(pdfPath);
  }
};

module.exports = { injectIntoTemplate, compileToPdf, compileLatexToPdf, cleanupJob };
