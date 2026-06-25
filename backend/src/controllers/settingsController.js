const prisma = require("../prisma");

/**
 * Retrieves the user's notification preferences (initializes defaults if not present).
 */
const getNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return res.status(200).json(settings);
  } catch (err) {
    next(err);
  }
};

/**
 * Updates the user's notification preferences.
 */
const updateNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { taskAssigned, taskCompleted, taskCommented, projectUpdates } = req.body;
    
    const updateData = {};
    if (taskAssigned !== undefined) updateData.taskAssigned = taskAssigned;
    if (taskCompleted !== undefined) updateData.taskCompleted = taskCompleted;
    if (taskCommented !== undefined) updateData.taskCommented = taskCommented;
    if (projectUpdates !== undefined) updateData.projectUpdates = projectUpdates;

    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });
    
    return res.status(200).json(settings);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotificationSettings,
  updateNotificationSettings,
};
