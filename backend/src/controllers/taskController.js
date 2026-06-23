const prisma = require("../prisma");
const dbQueries = require("../services/dbQueries");
const notificationService = require("../services/notificationService");
const activityService = require("../services/activityService");
const fs = require("fs");
const path = require("path");

/**
 * Helper to alert task watchers.
 */
const notifyWatchers = async (taskId, actionType, message, excludeUserId) => {
  try {
    const watchers = await prisma.taskWatcher.findMany({
      where: { taskId },
      select: { userId: true },
    });
    
    const recipientIds = watchers
      .map((w) => w.userId)
      .filter((uid) => uid !== excludeUserId);

    if (recipientIds.length > 0) {
      await notificationService.createBulkNotifications(recipientIds, actionType, message);
    }
  } catch (err) {
    console.error("[Watchers Notify Fail]", err);
  }
};

const getTasks = async (req, res, next) => {
  try {
    let { status, priority, assigneeId, page, limit, projectId } = req.query;

    if (req.user.role === "COLLABORATOR") {
      assigneeId = req.user.id;
    }

    // Verify project members access restriction
    if (projectId && req.user.role !== "ADMIN") {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project || project.deletedAt) {
        return res.status(404).json({ errorCode: "PROJECT_NOT_FOUND", message: "Project not found." });
      }
      if (project.ownerId !== req.user.id) {
        const isMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: { projectId, userId: req.user.id },
          },
        });
        if (!isMember) {
          return res.status(403).json({
            errorCode: "FORBIDDEN",
            message: "Only project members can access project tasks.",
          });
        }
      }
    }

    const result = await dbQueries.getTasksWithFilters({
      status,
      priority,
      assigneeId,
      projectId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await dbQueries.getTaskWithFullDetails(id);
    
    if (!task || task.deletedAt) {
      const error = new Error("Task not found.");
      error.statusCode = 404;
      error.errorCode = "TASK_NOT_FOUND";
      throw error;
    }

    // Verify project members access restriction
    if (req.user.role !== "ADMIN" && task.project.ownerId !== req.user.id) {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: task.projectId, userId: req.user.id },
        },
      });
      
      if (!isMember) {
        // Fallback for assignments check compatibility
        const isAssigned = task.assignments.some((a) => a.userId === req.user.id);
        if (!isAssigned && task.createdById !== req.user.id) {
          const error = new Error("You do not have permission to view this task.");
          error.statusCode = 403;
          error.errorCode = "FORBIDDEN";
          throw error;
        }
      }
    }

    return res.status(200).json(task);
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "PROJECT_MANAGER") {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only Administrators and Project Managers can create tasks.",
      });
    }

    const { title, description, status, priority, dueDate, startDate, estimatedHours, projectId, labels } = req.body;
    
    if (!title || !projectId) {
      const error = new Error("Title and Project ID are required.");
      error.statusCode = 400;
      error.errorCode = "BAD_REQUEST";
      throw error;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project || project.deletedAt) {
      const error = new Error("Associated project not found.");
      error.statusCode = 404;
      error.errorCode = "PROJECT_NOT_FOUND";
      throw error;
    }

    // Check project membership/ownership
    if (req.user.role !== "ADMIN" && project.ownerId !== req.user.id) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "You can only create tasks in projects you own.",
      });
    }

    // Resolve labels
    const labelConnections = [];
    if (Array.isArray(labels)) {
      for (const name of labels) {
        const labelRecord = await prisma.label.findUnique({ where: { name } });
        if (labelRecord) {
          labelConnections.push({ id: labelRecord.id });
        }
      }
    }

    // Get max position in this column for reorder sorting
    const tasksCount = await prisma.task.count({
      where: { projectId, status: status || "TODO", deletedAt: null },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startDate: startDate ? new Date(startDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        position: tasksCount,
        projectId,
        createdById: req.user.id,
        labels: {
          connect: labelConnections,
        },
      },
      include: {
        labels: true,
      },
    });

    // Record Activity
    await activityService.createActivity(
      projectId,
      req.user.id,
      `${req.user.name} created task "${title}".`
    );

    return res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, startDate, estimatedHours, labels } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!existingTask || existingTask.deletedAt) {
      return res.status(404).json({ errorCode: "TASK_NOT_FOUND", message: "Task not found." });
    }

    // Allow Admin or Project Manager of this project to edit
    if (req.user.role !== "ADMIN" && existingTask.project.ownerId !== req.user.id) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only Administrators and the Project Manager can edit tasks.",
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours ? parseFloat(estimatedHours) : null;

    if (Array.isArray(labels)) {
      const labelConnections = [];
      for (const name of labels) {
        const labelRecord = await prisma.label.findUnique({ where: { name } });
        if (labelRecord) {
          labelConnections.push({ id: labelRecord.id });
        }
      }
      updateData.labels = {
        set: labelConnections,
      };
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        labels: true,
      },
    });

    // Record Activity
    await activityService.createActivity(
      existingTask.projectId,
      req.user.id,
      `${req.user.name} updated task "${updatedTask.title}".`
    );

    // Notify Watchers
    await notifyWatchers(
      id,
      "TASK_UPDATED",
      `Task "${updatedTask.title}" details were updated by ${req.user.name}`,
      req.user.id
    );

    return res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask || existingTask.deletedAt) {
      return res.status(404).json({ errorCode: "TASK_NOT_FOUND", message: "Task not found." });
    }

    if (req.user.role !== "ADMIN" && existingTask.project.ownerId !== req.user.id) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only Administrators and Project Managers can delete tasks.",
      });
    }

    // Perform Soft Delete
    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Record Activity
    await activityService.createActivity(
      existingTask.projectId,
      req.user.id,
      `${req.user.name} deleted task "${existingTask.title}".`
    );

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const restoreTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask) {
      return res.status(404).json({ errorCode: "TASK_NOT_FOUND", message: "Task not found." });
    }

    if (req.user.role !== "ADMIN" && existingTask.project.ownerId !== req.user.id) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only Administrators and Project Managers can restore tasks.",
      });
    }

    await prisma.task.update({
      where: { id },
      data: { deletedAt: null },
    });

    // Record Activity
    await activityService.createActivity(
      existingTask.projectId,
      req.user.id,
      `${req.user.name} restored task "${existingTask.title}".`
    );

    return res.status(200).json({ message: "Task restored successfully" });
  } catch (err) {
    next(err);
  }
};

const assignTask = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "PROJECT_MANAGER") {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only Administrators and Project Managers can assign tasks.",
      });
    }

    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ errorCode: "BAD_REQUEST", message: "User ID is required." });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignments: true, project: true },
    });

    if (!task || task.deletedAt) {
      return res.status(404).json({ errorCode: "TASK_NOT_FOUND", message: "Task not found." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ errorCode: "USER_NOT_FOUND", message: "User not found." });
    }

    const alreadyAssigned = task.assignments.some((a) => a.userId === userId);
    if (alreadyAssigned) {
      return res.status(400).json({ errorCode: "BAD_REQUEST", message: "User is already assigned." });
    }

    await prisma.taskAssignment.create({
      data: { taskId: id, userId },
    });

    // Record Activity
    await activityService.createActivity(
      task.projectId,
      req.user.id,
      `${req.user.name} assigned task "${task.title}" to ${user.name}.`
    );

    // Notify User
    await notificationService.createNotification(
      userId,
      "TASK_ASSIGNED",
      `You have been assigned to task: "${task.title}"`
    );

    // Notify Watchers
    await notifyWatchers(
      id,
      "TASK_ASSIGNED",
      `Task "${task.title}" has been assigned to ${user.name} by ${req.user.name}`,
      req.user.id
    );

    return res.status(200).json({ message: "User assigned successfully" });
  } catch (err) {
    next(err);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["TODO", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      return res.status(400).json({ errorCode: "BAD_REQUEST", message: "Invalid status." });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignments: true, project: true },
    });

    if (!task || task.deletedAt) {
      return res.status(404).json({ errorCode: "TASK_NOT_FOUND", message: "Task not found." });
    }

    // Collaborator validation
    if (req.user.role === "COLLABORATOR") {
      const isAssigned = task.assignments.some((a) => a.userId === req.user.id);
      if (!isAssigned && task.createdById !== req.user.id) {
        return res.status(403).json({
          errorCode: "FORBIDDEN",
          message: "You can only update status for tasks assigned to you.",
        });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status },
    });

    const statusLabel = status.replace("_", " ").toLowerCase();

    // Record Activity
    const activityMsg =
      status === "COMPLETED"
        ? `${req.user.name} completed task "${task.title}".`
        : `${req.user.name} moved task "${task.title}" to "${statusLabel}".`;
        
    await activityService.createActivity(task.projectId, req.user.id, activityMsg);

    // Notify task creator and assignees
    const recipients = new Set();
    if (task.createdById !== req.user.id) {
      recipients.add(task.createdById);
    }
    task.assignments.forEach((a) => {
      if (a.userId !== req.user.id) {
        recipients.add(a.userId);
      }
    });

    if (recipients.size > 0) {
      await notificationService.createBulkNotifications(
        Array.from(recipients),
        "STATUS_CHANGED",
        `Task "${task.title}" status has been changed to ${statusLabel} by ${req.user.name}`
      );
    }

    // Notify Watchers
    await notifyWatchers(
      id,
      "STATUS_CHANGED",
      `Task "${task.title}" status changed to ${statusLabel} by ${req.user.name}`,
      req.user.id
    );

    return res.status(200).json(updatedTask);
  } catch (err) {
    next(err);
  }
};

const reorderTasks = async (req, res, next) => {
  try {
    const { projectId, status, taskIds } = req.body;
    if (!Array.isArray(taskIds)) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "taskIds must be an array of task IDs.",
      });
    }

    // Update positions inside a transaction
    await prisma.$transaction(
      taskIds.map((taskId, index) =>
        prisma.task.update({
          where: { id: taskId },
          data: { position: index, status },
        })
      )
    );

    return res.status(200).json({ message: "Tasks reordered successfully." });
  } catch (err) {
    next(err);
  }
};

// --- WATCHERS MANAGEMENT ---

const watchTask = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.deletedAt) {
      return res.status(404).json({ errorCode: "TASK_NOT_FOUND", message: "Task not found." });
    }

    const existingWatcher = await prisma.taskWatcher.findUnique({
      where: {
        taskId_userId: { taskId, userId },
      },
    });

    if (!existingWatcher) {
      await prisma.taskWatcher.create({
        data: { taskId, userId },
      });
    }

    return res.status(200).json({ message: "You are now watching this task." });
  } catch (err) {
    next(err);
  }
};

const unwatchTask = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    const userId = req.user.id;

    const watcher = await prisma.taskWatcher.findUnique({
      where: {
        taskId_userId: { taskId, userId },
      },
    });

    if (watcher) {
      await prisma.taskWatcher.delete({
        where: {
          taskId_userId: { taskId, userId },
        },
      });
    }

    return res.status(200).json({ message: "You have unwatched this task." });
  } catch (err) {
    next(err);
  }
};

// --- ATTACHMENTS MANAGEMENT ---

const uploadAttachment = async (req, res, next) => {
  try {
    const { id: taskId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "No file attachment was provided.",
      });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.deletedAt) {
      return res.status(404).json({ errorCode: "TASK_NOT_FOUND", message: "Task not found." });
    }

    const attachment = await prisma.attachment.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: "/uploads/" + req.file.filename,
        uploadedById: req.user.id,
        taskId,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Record Activity
    await activityService.createActivity(
      task.projectId,
      req.user.id,
      `${req.user.name} attached file "${req.file.originalname}" to task "${task.title}".`
    );

    // Notify Watchers
    await notifyWatchers(
      taskId,
      "ATTACHMENT_ADDED",
      `File "${req.file.originalname}" attached to task "${task.title}" by ${req.user.name}`,
      req.user.id
    );

    return res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
};

const deleteAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!attachment) {
      return res.status(404).json({
        errorCode: "ATTACHMENT_NOT_FOUND",
        message: "File attachment not found.",
      });
    }

    // Delete local file on disk
    const filename = path.basename(attachment.fileUrl);
    const filePath = path.join(__dirname, "../../uploads", filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.attachment.delete({ where: { id } });

    // Record Activity
    await activityService.createActivity(
      attachment.task.projectId,
      req.user.id,
      `${req.user.name} deleted attachment "${attachment.fileName}" from task "${attachment.task.title}".`
    );

    return res.status(200).json({ message: "Attachment deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
  assignTask,
  updateTaskStatus,
  reorderTasks,
  watchTask,
  unwatchTask,
  uploadAttachment,
  deleteAttachment,
};
