const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
} = require("../controllers/notificationController");

const router = express.Router();

// All notification routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get all notifications for the authenticated user
 * @access  Authenticated users
 */
router.get("/notifications", getNotificationsController);

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all notifications as read for the authenticated user
 * @access  Authenticated users
 * NOTE: This route must be defined BEFORE /notifications/:id/read
 *       to prevent Express from matching "read-all" as an :id parameter.
 */
router.patch("/notifications/read-all", markAllAsReadController);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Authenticated users
 */
router.patch("/notifications/:id/read", markAsReadController);

module.exports = router;
