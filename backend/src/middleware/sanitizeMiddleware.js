/**
 * Middleware to sanitize inputs against XSS and basic SQL Injection attempts.
 * Also enforces max length restrictions.
 */
const sanitizeInput = (req, res, next) => {
  const containsDangerousPattern = (val) => {
    if (typeof val !== 'string') return false;

    // 1. Script tag check & HTML onload/onerror handlers (XSS prevention)
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val)) return true;
    if (/javascript:/gi.test(val)) return true;
    if (/<[^>]*\b(on\w+)\s*=/gi.test(val)) return true;

    // 2. Simple SQLi pattern check (Keyword + special character)
    const sqlKeywords = /\b(union|select|insert|update|delete|drop|alter)\b/gi;
    const sqlChars = /['";-]/g;
    if (sqlKeywords.test(val) && sqlChars.test(val)) return true;

    return false;
  };

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'string') {
          // Trim whitespace
          obj[key] = obj[key].trim();

          // Enforce max length (e.g. 5000 characters)
          if (obj[key].length > 5000) {
            const err = new Error(`Input field '${key}' exceeds the maximum allowed length of 5000 characters.`);
            err.statusCode = 400;
            err.errorCode = "BAD_REQUEST";
            throw err;
          }

          // Check injection patterns
          if (containsDangerousPattern(obj[key])) {
            const err = new Error(`Input field '${key}' contains forbidden characters or potential injection patterns.`);
            err.statusCode = 400;
            err.errorCode = "POTENTIAL_INJECTION_ATTACK";
            throw err;
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          // Recursively sanitize nested objects
          sanitizeObject(obj[key]);
        }
      }
    }
  };

  try {
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    next();
  } catch (err) {
    return res.status(err.statusCode || 400).json({
      errorCode: err.errorCode || "VALIDATION_ERROR",
      message: err.message,
      details: null,
    });
  }
};

module.exports = {
  sanitizeInput,
};
