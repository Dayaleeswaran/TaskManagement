const notificationService = require("../services/notificationService");

/**
 * Controller to get all notifications for the authenticated user.
 */
const getNotificationsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, filter } = req.query;

    const options = {};
    if (page) options.page = parseInt(page, 10) || 1;
    if (limit) options.limit = parseInt(limit, 10) || 10;
    if (filter) options.filter = filter;

    const { notifications, total } = await notificationService.getNotificationsForUser(userId, options);

    if (page) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      return res.status(200).json({
        notifications,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

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
