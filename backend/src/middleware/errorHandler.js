/**
 * Centralized Error Handler Middleware
 * Formats errors into a standardized JSON response:
 * { errorCode, message, details }
 */
const errorHandler = (err, req, res, next) => {
  console.error("[Error Handler Log]:", err);

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || "INTERNAL_SERVER_ERROR";
  const message = err.message || "An unexpected error occurred.";
  const details = err.details || null;

  return res.status(statusCode).json({
    errorCode,
    message,
    details,
  });
};

module.exports = {
  errorHandler,
};
