/**
 * LaTeX Escape Utility
 *
 * Escapes special LaTeX characters in strings before injecting
 * them into .tex templates. Prevents compilation errors from
 * user-generated or LLM-generated content.
 */

/**
 * Characters that have special meaning in LaTeX and must be escaped.
 * Order matters — backslash must be escaped first to avoid double-escaping.
 */
const LATEX_SPECIAL_CHARS = [
  { char: '\\', replacement: '\\textbackslash{}' },
  { char: '&', replacement: '\\&' },
  { char: '%', replacement: '\\%' },
  { char: '$', replacement: '\\$' },
  { char: '#', replacement: '\\#' },
  { char: '_', replacement: '\\_' },
  { char: '{', replacement: '\\{' },
  { char: '}', replacement: '\\}' },
  { char: '~', replacement: '\\textasciitilde{}' },
  { char: '^', replacement: '\\textasciicircum{}' },
];

/**
 * Escapes special LaTeX characters in a string.
 * @param {string} text - Raw text to escape.
 * @returns {string} LaTeX-safe string.
 */
const escapeLatex = (text) => {
  if (typeof text !== 'string') return '';

  let escaped = text;
  for (const { char, replacement } of LATEX_SPECIAL_CHARS) {
    escaped = escaped.split(char).join(replacement);
  }
  return escaped;
};

/**
 * Recursively escapes all string values in an object.
 * @param {object} obj - Object with string values to escape.
 * @returns {object} New object with all strings LaTeX-escaped.
 */
const escapeLatexObject = (obj) => {
  if (typeof obj === 'string') return escapeLatex(obj);
  if (Array.isArray(obj)) return obj.map(escapeLatexObject);
  if (typeof obj === 'object' && obj !== null) {
    const escaped = {};
    for (const [key, value] of Object.entries(obj)) {
      escaped[key] = escapeLatexObject(value);
    }
    return escaped;
  }
  return obj;
};

module.exports = { escapeLatex, escapeLatexObject };
