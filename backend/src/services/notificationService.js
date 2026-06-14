const prisma = require("../prisma");
const { getIO } = require("../socket");

/**
 * Valid notification type constants.
 * These match the string values stored in the Notification.type column.
 */
const NotificationType = {
  TASK_ASSIGNED: "TASK_ASSIGNED",
  STATUS_CHANGED: "STATUS_CHANGED",
  COMMENT_ADDED: "COMMENT_ADDED",
  DEADLINE_APPROACHING: "DEADLINE_APPROACHING",
  ADMIN_UPDATE: "ADMIN_UPDATE",
};


/**
 * Emit a notification to a connected user via Socket.io.
 * @param {string} userId - The recipient's user ID (also their socket room).
 * @param {object} notificationPayload - The notification object to emit.
 */
const emitNotification = (userId, notificationPayload) => {
  try {
    const io = getIO();
    io.to(userId).emit("notification", notificationPayload);
  } catch (err) {
    // Socket.io may not be initialized in tests or during startup
    console.warn("[Socket.io] Could not emit notification:", err.message);
  }
};

/**
 * Creates a single notification for a user and emits it in real-time.
 * @param {string} userId - The recipient user's ID.
 * @param {string} type - The notification type (see NotificationType).
 * @param {string} message - The notification message text.
 * @returns {Promise<object>} The created notification.
 */
const createNotification = async (userId, type, message) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      message,
      isRead: false,
    },
  });

  // Emit to user's socket room for real-time delivery
  emitNotification(userId, notification);

  return notification;
};

/**
 * Creates notifications for multiple users and emits to each.
 * @param {string[]} userIds - Array of recipient user IDs.
 * @param {string} type - The notification type.
 * @param {string} message - The notification message text.
 * @returns {Promise<object[]>} Array of created notifications.
 */
const createBulkNotifications = async (userIds, type, message) => {
  if (!userIds || userIds.length === 0) return [];

  // Bulk insert via createManyAndReturn (supported in Postgres)
  const notifications = await prisma.notification.createManyAndReturn({
    data: userIds.map((userId) => ({
      userId,
      type,
      message,
      isRead: false,
    })),
  });

  // Emit to each user's socket room
  notifications.forEach((notification) => {
    emitNotification(notification.userId, notification);
  });

  return notifications;
};

/**
 * Retrieves all notifications for a given user, most recent first.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Array>} List of notification objects.
 */
const getNotificationsForUser = async (userId) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Marks a single notification as read, verifying it belongs to the requesting user.
 * @param {string} notificationId - The notification's ID.
 * @param {string} userId - The requesting user's ID.
 * @returns {Promise<object>} The updated notification.
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    const error = new Error("Notification not found.");
    error.statusCode = 404;
    error.errorCode = "NOTIFICATION_NOT_FOUND";
    throw error;
  }

  if (notification.userId !== userId) {
    const error = new Error("You are not authorized to update this notification.");
    error.statusCode = 403;
    error.errorCode = "FORBIDDEN";
    throw error;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

/**
 * Marks all notifications for a user as read.
 * @param {string} userId - The user's ID.
 * @returns {Promise<object>} Prisma batch update result.
 */
const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });
};

module.exports = {
  NotificationType,
  createNotification,
  createBulkNotifications,
  getNotificationsForUser,
  markAsRead,
  markAllAsRead,
};
