const prisma = require("../prisma");
const { getIO } = require("../socket");

/**
 * Valid notification type constants.
 * These match the string values stored in the Notification.type column.
 */
const NotificationType = {
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_COMPLETED: "TASK_COMPLETED",
  STATUS_CHANGED: "STATUS_CHANGED",
  COMMENT_ADDED: "COMMENT_ADDED",
  DEADLINE_APPROACHING: "DEADLINE_APPROACHING",
  ADMIN_UPDATE: "ADMIN_UPDATE",
  PROJECT_UPDATE: "PROJECT_UPDATE",
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
};

/**
 * Maps notification types to the corresponding NotificationSettings field.
 * Types not listed here are always sent (e.g. ADMIN_UPDATE, ACCOUNT_CREATED).
 */
const PREF_KEY_MAP = {
  TASK_ASSIGNED: "taskAssigned",
  STATUS_CHANGED: "taskCompleted",
  TASK_COMPLETED: "taskCompleted",
  COMMENT_ADDED: "taskCommented",
  PROJECT_UPDATE: "projectUpdates",
};

/**
 * Filters a list of userIds down to only those who have the relevant
 * notification preference enabled (or have no settings row yet, which
 * defaults to all-enabled).
 * @param {string[]} userIds
 * @param {string} type - A NotificationType value.
 * @returns {Promise<string[]>} Filtered list of userIds.
 */
const filterByPreference = async (userIds, type) => {
  const prefKey = PREF_KEY_MAP[type];
  // If this type has no preference gate, send to everyone
  if (!prefKey || !userIds || userIds.length === 0) return userIds || [];

  const settings = await prisma.notificationSettings.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, [prefKey]: true },
  });

  const settingsMap = {};
  settings.forEach((s) => { settingsMap[s.userId] = s[prefKey]; });

  // Users with no settings row default to true (enabled)
  return userIds.filter((id) => settingsMap[id] !== false);
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
  // Check user's preference before creating
  const allowed = await filterByPreference([userId], type);
  if (allowed.length === 0) return null;

  const notification = await prisma.notification.create({
    data: { userId, type, message, isRead: false },
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

  // Filter by user preferences
  const allowedIds = await filterByPreference(userIds, type);
  if (allowedIds.length === 0) return [];

  // Bulk insert via createManyAndReturn (supported in Postgres)
  const notifications = await prisma.notification.createManyAndReturn({
    data: allowedIds.map((userId) => ({
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
 * Retrieves notifications for a given user with optional filtering and pagination.
 * @param {string} userId - The user's ID.
 * @param {object} options - Filtering and pagination options.
 * @returns {Promise<{notifications: Array, total: number}>} List of notification objects and total count.
 */
const getNotificationsForUser = async (userId, options = {}) => {
  const { page, limit, filter } = options;
  const where = { userId };

  if (filter === "read") {
    where.isRead = true;
  } else if (filter === "unread") {
    where.isRead = false;
  }

  const queryOptions = {
    where,
    orderBy: { createdAt: "desc" },
  };

  if (page && limit) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    queryOptions.skip = (pageNum - 1) * limitNum;
    queryOptions.take = limitNum;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany(queryOptions),
    prisma.notification.count({ where }),
  ]);

  return { notifications, total };
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

/**
 * Marks a single notification as unread (Restore).
 * @param {string} notificationId - The notification's ID.
 * @param {string} userId - The requesting user's ID.
 * @returns {Promise<object>} The updated notification.
 */
const markAsUnread = async (notificationId, userId) => {
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
    data: { isRead: false },
  });
};

/**
 * Retrieves all active user IDs with the role ADMIN or SUPER_ADMIN.
 * @returns {Promise<string[]>} Array of admin/superadmin user IDs.
 */
const getAdminAndSuperAdminIds = async () => {
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
      isActive: true,
    },
    select: { id: true },
  });
  return admins.map((a) => a.id);
};

/**
 * Creates custom bulk notifications with different messages per user.
 * @param {object[]} notificationsArray - Array of { userId, type, message } objects.
 * @returns {Promise<object[]>} Array of created notifications.
 */
const createCustomBulkNotifications = async (notificationsArray) => {
  if (!notificationsArray || notificationsArray.length === 0) return [];

  // Group by type, filter each group by preferences
  const typeGroups = {};
  notificationsArray.forEach((n) => {
    if (!typeGroups[n.type]) typeGroups[n.type] = [];
    typeGroups[n.type].push(n);
  });

  const filtered = [];
  for (const [type, items] of Object.entries(typeGroups)) {
    const allowedIds = await filterByPreference(items.map((i) => i.userId), type);
    const allowedSet = new Set(allowedIds);
    items.forEach((item) => {
      if (allowedSet.has(item.userId)) filtered.push(item);
    });
  }

  if (filtered.length === 0) return [];

  const notifications = await prisma.notification.createManyAndReturn({
    data: filtered.map((notif) => ({
      userId: notif.userId,
      type: notif.type,
      message: notif.message,
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
 * Marks a single notification as starred.
 * @param {string} notificationId - The notification's ID.
 * @param {string} userId - The requesting user's ID.
 * @returns {Promise<object>} The updated notification.
 */
const markAsStarred = async (notificationId, userId) => {
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
    data: { isStarred: true },
  });
};

/**
 * Marks a single notification as unstarred.
 * @param {string} notificationId - The notification's ID.
 * @param {string} userId - The requesting user's ID.
 * @returns {Promise<object>} The updated notification.
 */
const markAsUnstarred = async (notificationId, userId) => {
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
    data: { isStarred: false },
  });
};

/**
 * Deletes a single notification.
 * @param {string} notificationId - The notification's ID.
 * @param {string} userId - The requesting user's ID.
 */
const deleteNotification = async (notificationId, userId) => {
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
    const error = new Error("You are not authorized to delete this notification.");
    error.statusCode = 403;
    error.errorCode = "FORBIDDEN";
    throw error;
  }

  return prisma.notification.delete({
    where: { id: notificationId },
  });
};

module.exports = {
  NotificationType,
  createNotification,
  createBulkNotifications,
  createCustomBulkNotifications,
  getNotificationsForUser,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  markAsStarred,
  markAsUnstarred,
  deleteNotification,
  getAdminAndSuperAdminIds,
};
