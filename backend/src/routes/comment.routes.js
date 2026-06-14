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
 * @route   POST /api/v1/tasks/:taskId/comments
 * @desc    Create a new comment on a task
 * @access  Authenticated users
 */
router.post("/tasks/:taskId/comments", validate(createCommentSchema), createCommentController);

/**
 * @route   GET /api/v1/tasks/:taskId/comments
 * @desc    Get all comments for a task
 * @access  Authenticated users
 */
router.get("/tasks/:taskId/comments", getCommentsByTaskController);

/**
 * @route   DELETE /api/v1/comments/:id
 * @desc    Delete a comment (author or ADMIN only)
 * @access  Authenticated users (author or ADMIN)
 */
router.delete("/comments/:id", deleteCommentController);

module.exports = router;
