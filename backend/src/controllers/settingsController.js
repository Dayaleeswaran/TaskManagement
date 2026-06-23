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
    
    const settings = await prisma.notificationSettings.update({
      where: { userId },
      data: {
        taskAssigned: taskAssigned !== undefined ? taskAssigned : undefined,
        taskCompleted: taskCompleted !== undefined ? taskCompleted : undefined,
        taskCommented: taskCommented !== undefined ? taskCommented : undefined,
        projectUpdates: projectUpdates !== undefined ? projectUpdates : undefined,
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
