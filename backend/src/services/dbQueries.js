const prisma = require("../prisma");

/**
 * Retrieves tasks with status, priority, and assignee filters and supports pagination.
 * Includes assigned users.
 * 
 * @param {Object} params
 * @param {string} [params.status] - Filter by Task status
 * @param {string} [params.priority] - Filter by Task priority
 * @param {string} [params.assigneeId] - Filter by assigned user ID
 * @param {number} [params.page=1] - Pagination page number
 * @param {number} [params.limit=10] - Pagination limit
 * @returns {Promise<Object>} Paginated task results with total count metadata
 */
async function getTasksWithFilters({ status, priority, assigneeId, projectId, page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;
  const where = { deletedAt: null }; // Soft delete filter

  if (status) {
    where.status = status;
  }
  if (priority) {
    where.priority = priority;
  }
  if (projectId) {
    where.projectId = projectId;
  }
  if (assigneeId) {
    where.assignments = {
      some: {
        userId: assigneeId
      }
    };
  }

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        labels: true
      },
      orderBy: [
        { position: "asc" },
        { createdAt: "desc" }
      ]
    }),
    prisma.task.count({ where })
  ]);

  return {
    tasks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Retrieves the count of unread notifications for a specific user.
 * Highly performant count operation using composite index [userId, isRead].
 * 
 * @param {string} userId - ID of the User
 * @returns {Promise<number>} Count of unread notifications
 */
async function getUnreadNotificationCount(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  return await prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });
}

/**
 * Retrieves a single task with all nested relations: project, comments (with author info),
 * and assignments (with user info).
 * 
 * @param {string} taskId - ID of the Task
 * @returns {Promise<Object|null>} Task details with fully nested relations
 */
async function getTaskWithFullDetails(taskId) {
  if (!taskId) {
    throw new Error("taskId is required");
  }

  return await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      },
      assignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      },
      labels: true,
      attachments: {
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });
}

module.exports = {
  prisma,
  getTasksWithFilters,
  getUnreadNotificationCount,
  getTaskWithFullDetails
};
