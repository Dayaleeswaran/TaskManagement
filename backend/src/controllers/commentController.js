const commentService = require("../services/commentService");

/**
 * Controller to create a comment on a task.
 */
const createCommentController = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { body } = req.body;
    const authorId = req.user.id;

    const comment = await commentService.createComment(taskId, authorId, body);
    return res.status(201).json({
      message: "Comment created successfully.",
      comment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to get all comments for a task.
 */
const getCommentsByTaskController = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await commentService.getCommentsByTask(taskId, req.user);
    return res.status(200).json({ comments });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to delete a comment.
 * Only the comment author or an ADMIN can delete.
 */
const deleteCommentController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    await commentService.deleteComment(id, requestingUserId, requestingUserRole);
    return res.status(200).json({ message: "Comment deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCommentController,
  getCommentsByTaskController,
  deleteCommentController,
};
