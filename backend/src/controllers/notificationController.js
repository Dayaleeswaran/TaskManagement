const notificationService = require("../services/notificationService");

/**
 * Controller to get all notifications for the authenticated user.
 */
const getNotificationsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await notificationService.getNotificationsForUser(userId);
    return res.status(200).json({ notifications });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to mark a single notification as read.
 */
const markAsReadController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.markAsRead(id, userId);
    return res.status(200).json({
      message: "Notification marked as read.",
      notification,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to mark all notifications as read for the authenticated user.
 */
const markAllAsReadController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);
    return res.status(200).json({
      message: "All notifications marked as read.",
      count: result.count,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
};
