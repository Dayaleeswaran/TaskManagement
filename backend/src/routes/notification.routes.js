const express = require("express");
const { verifyToken, checkPasswordReset } = require("../middleware/authMiddleware");
const {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  markAsUnreadController,
  markAsStarredController,
  markAsUnstarredController,
} = require("../controllers/notificationController");

const router = express.Router();

// All notification routes require authentication and password reset check
router.use(verifyToken);
router.use(checkPasswordReset);

// GET all notifications
router.get("/notifications", getNotificationsController);

// PATCH mark all as read
router.patch("/notifications/read-all", markAllAsReadController);

// PATCH single notification mark options
router.patch("/notifications/:id/read", markAsReadController);
router.patch("/notifications/:id/unread", markAsUnreadController);
router.patch("/notifications/:id/star", markAsStarredController);
router.patch("/notifications/:id/unstar", markAsUnstarredController);

module.exports = router;
