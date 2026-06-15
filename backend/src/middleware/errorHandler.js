const { Prisma } = require("@prisma/client");

/**
 * Centralized Error Handler Middleware
 * Formats errors into a standardized JSON response:
 * { errorCode, message, details }
 */
const errorHandler = (err, req, res, next) => {
  console.error("[Error Handler Log]:", err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return res.status(409).json({
          errorCode: "CONFLICT",
          message: "A unique constraint validation failed. The resource already exists.",
          details: err.meta?.target || null
        });
      case "P2025":
        return res.status(404).json({
          errorCode: "NOT_FOUND",
          message: err.meta?.cause || "Record not found on the server.",
          details: null
        });
      default:
        return res.status(400).json({
          errorCode: `BAD_REQUEST_DB_${err.code}`,
          message: `Database operation failed: ${err.message}`,
          details: err.meta || null
        });
    }
  }

  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.errorCode || err.code || "INTERNAL_SERVER_ERROR";
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

