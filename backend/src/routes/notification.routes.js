const express = require("express");
const { verifyToken, checkPasswordReset } = require("../middleware/authMiddleware");
const {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
} = require("../controllers/notificationController");

const router = express.Router();

// All notification routes require authentication and password reset check
router.use(verifyToken);
router.use(checkPasswordReset);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieve all notifications for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationSchema'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/notifications", getNotificationsController);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Mark all notifications for the authenticated user as read.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch("/notifications/read-all", markAllAsReadController);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     description: Mark a single notification by ID as read.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationSchema'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.patch("/notifications/:id/read", markAsReadController);

module.exports = router;
