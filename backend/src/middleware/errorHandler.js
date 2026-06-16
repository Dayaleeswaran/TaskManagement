const { Prisma } = require("@prisma/client");

/**
 * Centralized Error Handler Middleware
 * Formats errors into a standardized JSON response:
 * { errorCode, message, details }
 */
const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Detailed server logging internally
  console.error("[Error Handler Log]:", err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return res.status(409).json({
          errorCode: "CONFLICT",
          message: "A unique constraint validation failed. The resource already exists.",
          details: isProduction ? null : err.meta?.target || null,
        });
      case "P2025":
        return res.status(404).json({
          errorCode: "NOT_FOUND",
          message: isProduction ? "Record not found." : err.meta?.cause || "Record not found on the server.",
          details: null,
        });
      default:
        return res.status(400).json({
          errorCode: "DATABASE_ERROR",
          message: isProduction ? "A database error occurred." : `Database operation failed: ${err.message}`,
          details: isProduction ? null : err.meta || null,
        });
    }
  }

  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.errorCode || err.code || "INTERNAL_SERVER_ERROR";
  
  let message = err.message || "An unexpected error occurred.";
  let details = err.details || null;

  // Mask detailed 500 error messages in production
  if (isProduction && statusCode === 500) {
    message = "An unexpected error occurred.";
    details = null;
  }

  return res.status(statusCode).json({
    errorCode,
    message,
    details,
  });
};

module.exports = {
  errorHandler,
};

