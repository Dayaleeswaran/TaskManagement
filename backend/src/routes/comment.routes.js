const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const { createCommentSchema } = require("../validators/commentSchemas");
const {
  createCommentController,
  getCommentsByTaskController,
  deleteCommentController,
} = require("../controllers/commentController");

const router = express.Router();

// All comment routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /api/v1/tasks/{taskId}/comments:
 *   post:
 *     summary: Create a comment on a task
 *     description: Add a new comment to a task.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentSchema'
 *       400:
 *         description: Invalid input or schema validation failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post("/tasks/:taskId/comments", validate(createCommentSchema), createCommentController);

/**
 * @swagger
 * /api/v1/tasks/{taskId}/comments:
 *   get:
 *     summary: Get comments for a task
 *     description: Retrieve all comments associated with a specific task.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: List of comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommentSchema'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get("/tasks/:taskId/comments", getCommentsByTaskController);

/**
 * @swagger
 * /api/v1/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     description: Delete an existing comment (author or ADMIN only).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not authorized to delete this comment)
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.delete("/comments/:id", deleteCommentController);

module.exports = router;
