const prisma = require("../prisma");

/**
 * Creates a system audit log record for compliance tracking.
 * 
 * @param {string} action - Describe the operation (e.g. "USER_DEACTIVATED")
 * @param {string} performedBy - ID of the User who executed the action
 * @param {string} [targetId] - Optional target entity UUID
 * @param {Object} [metadata] - Optional JSON metadata
 * @returns {Promise<Object>} The created audit log object
 */
const log = async (action, performedBy, targetId = null, metadata = null) => {
  try {
    const logEntry = await prisma.auditLog.create({
      data: {
        action,
        performedBy,
        targetId,
        metadata: metadata || undefined,
      },
    });
    return logEntry;
  } catch (err) {
    console.error(`[Audit Service] Failed to create audit log entry:`, err);
  }
};

module.exports = {
  log,
};
