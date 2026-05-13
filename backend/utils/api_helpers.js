/**
 * API Helper Utilities
 *
 * Common helper functions for API responses, error formatting,
 * and retry logic for rate-limited external API calls.
 */

/**
 * Wraps an async route handler to catch errors and forward to Express error handler.
 * @param {Function} fn - Async route handler function.
 * @returns {Function} Express middleware function.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Retries an async function with exponential backoff.
 * Useful for handling API rate limits (429 responses).
 * @param {Function} fn - Async function to retry.
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3).
 * @param {number} baseDelay - Base delay in ms (default: 1000).
 * @returns {Promise<*>} Result of the function.
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const isRateLimited = error.response?.status === 429;
      const delay = isRateLimited
        ? baseDelay * Math.pow(2, attempt)
        : baseDelay;

      console.warn(`⚠️ Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Formats a standard success response.
 * @param {object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Response message.
 * @param {*} data - Response data payload.
 */
const sendSuccess = (res, statusCode, message, data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  res.status(statusCode).json(response);
};

module.exports = { asyncHandler, retryWithBackoff, sendSuccess };
