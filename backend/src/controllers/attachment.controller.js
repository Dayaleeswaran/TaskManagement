const prisma = require("../prisma");
const attachmentService = require("../services/attachment.service");
const activityService = require("../services/activityService");
const notificationService = require("../services/notificationService");
const { getIO } = require("../socket");
const path = require("path");

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
];

// Disallowed extensions (double check for executables)
const DISALLOWED_EXTENSIONS = [".exe", ".bat", ".sh", ".js", ".vbs", ".cmd", ".msi", ".com", ".scr"];

/**
 * Validates file size and type.
 */
const validateFile = (file) => {
  if (!file) {
    const error = new Error("No file uploaded.");
    error.statusCode = 400;
    return error;
  }

  // Max 20MB check
  if (file.size > 20 * 1024 * 1024) {
    const error = new Error("File size exceeds the 20 MB limit.");
    error.statusCode = 400;
    return error;
  }

  // MIME type check
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error("Invalid file type. Only PDF, DOCX, XLSX, TXT, PNG, JPG, GIF, WEBP, and ZIP files are allowed.");
    error.statusCode = 400;
    return error;
  }

  // Extension check
  const ext = path.extname(file.originalname).toLowerCase();
  if (DISALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error("Executable or script files are strictly rejected.");
    error.statusCode = 400;
    return error;
  }

  return null;
};

/**
 * Checks if the user is a project member or owner.
 */
const verifyProjectAccess = async (projectId, userId, userRole) => {
  if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.deletedAt) return false;
  if (project.ownerId === userId) return true;

  const isMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  return !!isMember;
};

exports.uploadAttachment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    
    // File validation
    const fileError = validateFile(req.file);
    if (fileError) throw fileError;

    // Check task and project existence
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { 
        project: true,
        assignments: true, 
      },
    });

    if (!task || task.deletedAt) {
      const error = new Error("Task not found.");
      error.statusCode = 404;
      throw error;
    }

    // Access control
    if (req.user.role === "ADMIN") {
      const error = new Error("You do not have permission to upload files to this project.");
      error.statusCode = 403;
      throw error;
    }
    const hasAccess = await verifyProjectAccess(task.projectId, req.user.id, req.user.role);
    if (!hasAccess) {
      const error = new Error("You do not have permission to upload files to this project.");
      error.statusCode = 403;
      throw error;
    }

    // Upload to Supabase Storage
    const bucketPath = await attachmentService.uploadFile(task.projectId, task.id, req.file);

    // Save attachment record in Database
    const attachment = await prisma.attachment.create({
      data: {
        fileName: req.file.originalname,
        bucketPath,
        mimeType: req.file.mimetype,
        size: req.file.size,
        taskId: task.id,
        uploadedBy: req.user.id,
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Record Activity
    await activityService.createActivity(
      task.projectId,
      req.user.id,
      `${req.user.name} uploaded ${req.file.originalname} | task:${task.id}`
    );

    // Create database notifications only for assigned task members (excluding uploader)
    const notificationRecipients = new Set();
    if (task.assignments) {
      task.assignments.forEach((a) => notificationRecipients.add(a.userId));
    }
    notificationRecipients.delete(req.user.id);

    if (notificationRecipients.size > 0) {
      await notificationService.createBulkNotifications(
        Array.from(notificationRecipients),
        "TASK_ATTACHMENT_UPLOADED",
        `${req.user.name} uploaded attachment "${req.file.originalname}" to task: ${task.title} | task:${task.id}`
      );
    }

    // Emit Socket.io events to all project members (for real-time UI sync)
    try {
      const io = getIO();
      const allProjectUserIds = new Set();
      allProjectUserIds.add(task.project.ownerId);
      const members = await prisma.projectMember.findMany({
        where: { projectId: task.projectId },
        select: { userId: true },
      });
      members.forEach((m) => allProjectUserIds.add(m.userId));
      allProjectUserIds.add(req.user.id); // Notify uploader as well for cross-tab sync

      allProjectUserIds.forEach((memberId) => {
        io.to(memberId).emit("attachment_uploaded", { taskId: task.id, attachment });
      });
    } catch (socketError) {
      console.warn("[Socket.io] Failed to emit attachment_uploaded event:", socketError.message);
    }

    res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
};

exports.getAttachments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.deletedAt) {
      const error = new Error("Task not found.");
      error.statusCode = 404;
      throw error;
    }

    // Access control
    const hasAccess = await verifyProjectAccess(task.projectId, req.user.id, req.user.role);
    if (!hasAccess) {
      const error = new Error("You do not have permission to view this task's attachments.");
      error.statusCode = 403;
      throw error;
    }

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(attachments);
  } catch (err) {
    next(err);
  }
};

exports.downloadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        task: true,
      },
    });

    if (!attachment) {
      const error = new Error("Attachment not found.");
      error.statusCode = 404;
      throw error;
    }

    // Access control
    const hasAccess = await verifyProjectAccess(attachment.task.projectId, req.user.id, req.user.role);
    if (!hasAccess) {
      const error = new Error("You do not have permission to download files from this project.");
      error.statusCode = 403;
      throw error;
    }

    // Generate 5 minutes expiry signed URL
    const signedUrl = await attachmentService.generateSignedUrl(attachment.bucketPath);

    // Redirect to the secure Supabase URL
    res.redirect(signedUrl);
  } catch (err) {
    next(err);
  }
};

exports.deleteAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        task: {
          include: { 
            project: true,
            assignments: true,
          },
        },
      },
    });

    if (!attachment) {
      const error = new Error("Attachment not found.");
      error.statusCode = 404;
      throw error;
    }

    // Access check: only uploader, project owner, or Super Admins can delete
    const isUploader = attachment.uploadedBy === req.user.id;
    const isProjectOwner = attachment.task.project.ownerId === req.user.id;
    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    if (!isUploader && !isProjectOwner && !isSuperAdmin) {
      const error = new Error("You do not have permission to delete this attachment.");
      error.statusCode = 403;
      throw error;
    }

    // Delete from Supabase Storage
    await attachmentService.deleteFile(attachment.bucketPath);

    // Delete from Database
    await prisma.attachment.delete({
      where: { id },
    });

    // Record Activity
    await activityService.createActivity(
      attachment.task.projectId,
      req.user.id,
      `${req.user.name} deleted attachment ${attachment.fileName} | task:${attachment.taskId}`
    );

    // Create database notifications only for assigned task members (excluding uploader)
    const notificationRecipients = new Set();
    if (attachment.task.assignments) {
      attachment.task.assignments.forEach((a) => notificationRecipients.add(a.userId));
    }
    notificationRecipients.delete(req.user.id);

    if (notificationRecipients.size > 0) {
      await notificationService.createBulkNotifications(
        Array.from(notificationRecipients),
        "TASK_ATTACHMENT_DELETED",
        `${req.user.name} deleted attachment "${attachment.fileName}" from task: ${attachment.task.title} | task:${attachment.task.id}`
      );
    }

    // Emit Socket.io events to all project members (for real-time UI sync)
    try {
      const io = getIO();
      const allProjectUserIds = new Set();
      allProjectUserIds.add(attachment.task.project.ownerId);
      const members = await prisma.projectMember.findMany({
        where: { projectId: attachment.task.projectId },
        select: { userId: true },
      });
      members.forEach((m) => allProjectUserIds.add(m.userId));
      allProjectUserIds.add(req.user.id);

      allProjectUserIds.forEach((memberId) => {
        io.to(memberId).emit("attachment_deleted", { taskId: attachment.taskId, attachmentId: attachment.id });
      });
    } catch (socketError) {
      console.warn("[Socket.io] Failed to emit attachment_deleted event:", socketError.message);
    }

    res.status(200).json({ message: "Attachment deleted successfully" });
  } catch (err) {
    next(err);
  }
};
