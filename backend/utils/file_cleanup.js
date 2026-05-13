const fs = require('fs');
const path = require('path');

/**
 * File Cleanup Utility
 *
 * Deletes temporary files generated during LaTeX compilation.
 * Prevents server storage leaks by cleaning up .tex, .aux, .log, .out files.
 */

/**
 * Extensions to clean up after PDF compilation.
 */
const TEMP_EXTENSIONS = ['.tex', '.aux', '.log', '.out', '.fls', '.fdb_latexmk', '.synctex.gz'];

/**
 * Deletes all temporary LaTeX files for a given base name.
 * @param {string} basePath - Full path without extension (e.g., /temp/resume_12345)
 */
const cleanupTempFiles = (basePath) => {
  for (const ext of TEMP_EXTENSIONS) {
    const filePath = `${basePath}${ext}`;
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to delete temp file: ${filePath}`, error.message);
    }
  }
};

/**
 * Deletes a specific file if it exists.
 * @param {string} filePath - Absolute path to the file.
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to delete file: ${filePath}`, error.message);
  }
};

module.exports = { cleanupTempFiles, deleteFile };
