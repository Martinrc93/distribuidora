/**
 * Strips HTML tags from a string and trims the result.
 * @param {*} value The value to sanitize.
 * @returns {string|*} The sanitized string or original value.
 */
function sanitizeInput(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/<[^>]*>/g, '').trim();
}

module.exports = sanitizeInput;
