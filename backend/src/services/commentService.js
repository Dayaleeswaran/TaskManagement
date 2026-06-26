const prisma = require("../prisma");
const notificationService = require("./notificationService");
const activityService = require("./activityService");

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
      project: true,
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

  // Enforce task access permission for comment creator
  if (author.role === "ADMIN") {
    const error = new Error("Administrators do not have permission to comment on tasks.");
    error.statusCode = 403;
    error.errorCode = "FORBIDDEN";
    throw error;
  }

  if (author.role === "COLLABORATOR") {
    const isAssigned = task.assignments.some((a) => a.userId === authorId);
    const isProjectMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: task.projectId, userId: authorId },
      },
    });
    if (!isAssigned && task.createdById !== authorId && !isProjectMember) {
      const error = new Error("You do not have permission to comment on this task.");
      error.statusCode = 403;
      error.errorCode = "FORBIDDEN";
      throw error;
    }
  } else if (author.role === "PROJECT_MANAGER") {
    if (task.project.ownerId !== authorId) {
      const error = new Error("You do not have permission to comment on this task.");
      error.statusCode = 403;
      error.errorCode = "FORBIDDEN";
      throw error;
    }
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

  // 4. Send notification to the task creator, assignees, project owner, and administrators, excluding the author
  const recipientIds = new Set();
  if (task.createdById !== authorId) {
    recipientIds.add(task.createdById);
  }
  task.assignments.forEach((assignment) => {
    if (assignment.userId !== authorId) {
      recipientIds.add(assignment.userId);
    }
  });
  if (task.project.ownerId !== authorId) {
    recipientIds.add(task.project.ownerId);
  }

  // Add Admins and Super Admins
  const adminIds = await notificationService.getAdminAndSuperAdminIds();
  adminIds.forEach((id) => {
    if (id !== authorId) {
      recipientIds.add(id);
    }
  });

  if (recipientIds.size > 0) {
    const message = `${author.name} commented on task: ${task.title} | task:${task.id}`;
    await notificationService.createBulkNotifications(
      Array.from(recipientIds),
      "COMMENT_ADDED",
      message
    );
  }

  // Record Activity
  await activityService.createActivity(
    task.projectId,
    authorId,
    `${author.name} commented on this task | task:${taskId}`
  );

  return comment;
};

/**
 * Retrieves all comments associated with a task in chronological order.
 * @param {string} taskId - The ID of the task.
 * @param {object} requestingUser - The requesting user object.
 * @returns {Promise<Array>} List of comment objects.
 */
const getCommentsByTask = async (taskId, requestingUser) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignments: true,
      project: true,
    },
  });

  if (!task) {
    const error = new Error("Task not found.");
    error.statusCode = 404;
    error.errorCode = "TASK_NOT_FOUND";
    throw error;
  }

  // Enforce task access permission for comment retriever
  if (requestingUser.role === "COLLABORATOR") {
    const isAssigned = task.assignments.some((a) => a.userId === requestingUser.id);
    const isProjectMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: task.projectId, userId: requestingUser.id },
      },
    });
    if (!isAssigned && task.createdById !== requestingUser.id && !isProjectMember) {
      const error = new Error("You do not have permission to view comments for this task.");
      error.statusCode = 403;
      error.errorCode = "FORBIDDEN";
      throw error;
    }
  } else if (requestingUser.role === "PROJECT_MANAGER") {
    if (task.project.ownerId !== requestingUser.id) {
      const error = new Error("You do not have permission to view comments for this task.");
      error.statusCode = 403;
      error.errorCode = "FORBIDDEN";
      throw error;
    }
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

  // Access Control check: Author or SUPER_ADMIN only
  if (comment.authorId !== requestingUserId && requestingUserRole !== "SUPER_ADMIN") {
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
