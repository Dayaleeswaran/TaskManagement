const prisma = require("../prisma");

/**
 * Middleware to enforce role-based attachment viewing/downloading permissions.
 * Matches specifications from Business Logic 7.
 */
const checkAttachmentPermission = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const { role, id: userId } = req.user;

    // Find attachment by filename suffix
    const attachment = await prisma.attachment.findFirst({
      where: { fileUrl: { endsWith: filename } },
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
      return res.status(404).json({
        errorCode: "ATTACHMENT_NOT_FOUND",
        message: "File attachment not found in system record.",
      });
    }

    const task = attachment.task;
    const project = task.project;

    // 1. SUPER_ADMIN and ADMIN: Can view all attachments
    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      return next();
    }

    // 2. PROJECT_MANAGER: Can view attachments in projects they manage (own)
    if (role === "PROJECT_MANAGER") {
      if (project.ownerId === userId) {
        return next();
      }
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "You do not have permission to view attachments in this project.",
      });
    }

    // 3. COLLABORATOR: Can view only if Project Member OR Task Assignee
    if (role === "COLLABORATOR") {
      // Check if assigned to the task
      const isAssignee = task.assignments.some((a) => a.userId === userId);
      if (isAssignee) {
        return next();
      }

      // Check if project member
      const isMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: project.id, userId },
        },
      });
      if (isMember) {
        return next();
      }

      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "You do not have permission to view this attachment.",
      });
    }

    return res.status(403).json({
      errorCode: "FORBIDDEN",
      message: "Access Denied.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkAttachmentPermission,
};
