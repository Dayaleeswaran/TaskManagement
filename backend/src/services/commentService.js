const prisma = require("../prisma");
const notificationService = require("./notificationService");

/**
 * Creates a comment on a specific task and triggers notifications for the task owner and assignees.
 * @param {string} taskId - The ID of the task being commented on.
 * @param {string} authorId - The ID of the user writing the comment.
 * @param {string} body - The text content of the comment.
 * @returns {Promise<object>} The created comment object.
 */
const createComment = async (taskId, authorId, body) => {
  // 1. Check if the task exists
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignments: true,
    },
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.errorCode = "TASK_NOT_FOUND";
    throw error;
  }

  // 2. Fetch author details
  const author = await prisma.user.findUnique({
    where: { id: authorId },
  });

  if (!author) {
    const error = new Error("Comment author user not found.");
    error.statusCode = 404;
    error.errorCode = "USER_NOT_FOUND";
    throw error;
  }

  // 3. Persist the comment
  const comment = await prisma.comment.create({
    data: {
      body,
      taskId,
      authorId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // 4. Send notification to the task creator and assignees, excluding the author
  const recipientIds = new Set();
  if (task.createdById !== authorId) {
    recipientIds.add(task.createdById);
  }
  task.assignments.forEach((assignment) => {
    if (assignment.userId !== authorId) {
      recipientIds.add(assignment.userId);
    }
  });

  if (recipientIds.size > 0) {
    const message = `${author.name} commented on task "${task.title}": "${
      body.length > 50 ? body.substring(0, 50) + "..." : body
    }"`;
    await notificationService.createBulkNotifications(
      Array.from(recipientIds),
      "COMMENT_ADDED",
      message
    );
  }

  return comment;
};

/**
 * Retrieves all comments associated with a task in chronological order.
 * @param {string} taskId - The ID of the task.
 * @returns {Promise<Array>} List of comment objects.
 */
const getCommentsByTask = async (taskId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.errorCode = "TASK_NOT_FOUND";
    throw error;
  }

  return prisma.comment.findMany({
    where: { taskId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

/**
 * Deletes a comment. Authorized for the comment author or admins only.
 * @param {string} commentId - The ID of the comment to delete.
 * @param {string} requestingUserId - The ID of the user requesting deletion.
 * @param {string} requestingUserRole - The role of the requesting user (e.g. 'ADMIN').
 * @returns {Promise<object>} The deleted comment object.
 */
const deleteComment = async (commentId, requestingUserId, requestingUserRole) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    const error = new Error("Comment not found.");
    error.statusCode = 404;
    error.errorCode = "COMMENT_NOT_FOUND";
    throw error;
  }

  // Access Control check: Author or ADMIN only
  if (comment.authorId !== requestingUserId && requestingUserRole !== "ADMIN") {
    const error = new Error("You are not authorized to delete this comment.");
    error.statusCode = 403;
    error.errorCode = "FORBIDDEN";
    throw error;
  }

  return prisma.comment.delete({
    where: { id: commentId },
  });
};

module.exports = {
  createComment,
  getCommentsByTask,
  deleteComment,
};
