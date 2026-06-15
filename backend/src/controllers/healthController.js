const prisma = require("../prisma");

/**
 * Health check controller to verify database and server status.
 * Run query: SELECT 1 using Prisma $queryRaw
 */
exports.checkHealth = async (req, res) => {
  try {
    // Run raw SQL SELECT 1 to verify database responsiveness
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database health check failure:", error);
    return res.status(500).json({
      status: "error",
      db: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
