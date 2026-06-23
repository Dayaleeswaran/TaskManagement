const prisma = require("../prisma");
const { getIO } = require("../socket");

/**
 * Creates a project activity entry and emits it via socket to all project members.
 * 
 * @param {string} projectId - ID of the Project
 * @param {string} userId - ID of the User who performed the action
 * @param {string} actionText - Description of the action (e.g. "Admin created project Acme")
 * @returns {Promise<Object>} The created activity object
 */
const createActivity = async (projectId, userId, actionText) => {
  try {
    const activity = await prisma.activity.create({
      data: {
        projectId,
        userId,
        action: actionText,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Attempt real-time socket delivery
    try {
      const io = getIO();
      if (io) {
        // Retrieve all project members and the project owner
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: {
            ownerId: true,
            members: {
              select: {
                userId: true,
              },
            },
          },
        });

        if (project) {
          const recipients = new Set();
          recipients.add(project.ownerId);
          project.members.forEach((m) => recipients.add(m.userId));

          // Broadcast activity to the personal socket rooms of all participants
          recipients.forEach((memberId) => {
            io.to(memberId).emit("activity", activity);
          });
        }
      }
    } catch (socketError) {
      // Ignored if socket is not initialized (e.g. in test runs or seeding)
    }

    return activity;
  } catch (err) {
    console.error(`[Activity Service] Failed to create project activity log:`, err);
  }
};

module.exports = {
  createActivity,
};
