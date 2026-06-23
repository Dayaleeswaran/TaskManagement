const prisma = require("../prisma");
const activityService = require("../services/activityService");
const auditService = require("../services/auditService");

const getProjects = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    let where = { deletedAt: null }; // Exclude soft-deleted projects
    
    if (role === "PROJECT_MANAGER") {
      where.ownerId = userId;
    } else if (role === "COLLABORATOR") {
      where.OR = [
        { ownerId: userId },
        { members: { some: { userId } } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(projects);
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "PROJECT_MANAGER") {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only Administrators and Project Managers can create projects.",
      });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "Project name is required.",
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || "",
        ownerId: req.user.id,
      },
    });

    // Automatically record activity
    await activityService.createActivity(
      project.id,
      req.user.id,
      `${req.user.name} created project "${name}".`
    );

    // Audit Log entry
    await auditService.log(
      "PROJECT_CREATE",
      req.user.id,
      project.id,
      { projectName: name }
    );

    return res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "PROJECT_MANAGER") {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only Administrators and Project Managers can edit projects.",
      });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject || existingProject.deletedAt) {
      return res.status(404).json({
        errorCode: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      });
    }

    // Check ownership if not admin
    if (req.user.role !== "ADMIN" && existingProject.ownerId !== req.user.id) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "You can only update projects that you own.",
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingProject.name,
        description: description !== undefined ? description : existingProject.description,
      },
    });

    return res.status(200).json(project);
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "PROJECT_MANAGER") {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only Administrators and Project Managers can archive/delete projects.",
      });
    }

    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject || existingProject.deletedAt) {
      return res.status(404).json({
        errorCode: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      });
    }

    // Check ownership if not admin
    if (req.user.role !== "ADMIN" && existingProject.ownerId !== req.user.id) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "You can only delete projects that you own.",
      });
    }

    // Perform Soft Delete
    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Record Activity
    await activityService.createActivity(
      id,
      req.user.id,
      `${req.user.name} archived project "${existingProject.name}".`
    );

    // Audit Log entry
    await auditService.log(
      "PROJECT_ARCHIVE",
      req.user.id,
      id,
      { projectName: existingProject.name }
    );

    return res.status(200).json({ message: "Project archived successfully." });
  } catch (err) {
    next(err);
  }
};

const restoreProject = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "PROJECT_MANAGER") {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only Administrators and Project Managers can restore projects.",
      });
    }

    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({
        errorCode: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      });
    }

    if (req.user.role !== "ADMIN" && existingProject.ownerId !== req.user.id) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "You can only restore projects that you own.",
      });
    }

    await prisma.project.update({
      where: { id },
      data: { deletedAt: null },
    });

    // Record Activity
    await activityService.createActivity(
      id,
      req.user.id,
      `${req.user.name} restored project "${existingProject.name}".`
    );

    // Audit Log entry
    await auditService.log(
      "PROJECT_RESTORE",
      req.user.id,
      id,
      { projectName: existingProject.name }
    );

    return res.status(200).json({ message: "Project restored successfully." });
  } catch (err) {
    next(err);
  }
};

// --- MEMBERS MANAGEMENT ---

const getProjectMembers = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { id: userId, role } = req.user;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!project || project.deletedAt) {
      return res.status(404).json({
        errorCode: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      });
    }

    // Verify membership access
    if (role !== "ADMIN" && project.ownerId !== userId) {
      const isMember = project.members.some((m) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({
          errorCode: "FORBIDDEN",
          message: "You do not have access to view this project's members.",
        });
      }
    }

    const members = project.members.map((m) => m.user);
    return res.status(200).json(members);
  } catch (err) {
    next(err);
  }
};

const addProjectMember = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { userId } = req.body;
    const { id: currentUserId, role } = req.user;

    if (!userId) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "User ID is required.",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.deletedAt) {
      return res.status(404).json({
        errorCode: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      });
    }

    // Only Owner (Project Manager) or Admin can add members
    if (role !== "ADMIN" && project.ownerId !== currentUserId) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only the Project Manager or Admin can manage members.",
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({
        errorCode: "USER_NOT_FOUND",
        message: "Active user account not found.",
      });
    }

    // Check if already member
    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (existingMembership) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "User is already a project member.",
      });
    }

    const membership = await prisma.projectMember.create({
      data: { projectId, userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Record Activity
    await activityService.createActivity(
      projectId,
      currentUserId,
      `${req.user.name} added ${targetUser.name} to project.`
    );

    return res.status(201).json(membership.user);
  } catch (err) {
    next(err);
  }
};

const removeProjectMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;
    const { id: currentUserId, role } = req.user;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.deletedAt) {
      return res.status(404).json({
        errorCode: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      });
    }

    // Only Owner or Admin can remove members
    if (role !== "ADMIN" && project.ownerId !== currentUserId) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only the Project Manager or Admin can manage members.",
      });
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
      include: {
        user: true,
      },
    });

    if (!membership) {
      return res.status(404).json({
        errorCode: "MEMBER_NOT_FOUND",
        message: "Membership not found in this project.",
      });
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    // Record Activity
    await activityService.createActivity(
      projectId,
      currentUserId,
      `${req.user.name} removed ${membership.user.name} from project.`
    );

    return res.status(200).json({ message: "Member removed successfully." });
  } catch (err) {
    next(err);
  }
};

const getProjectActivities = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { id: userId, role } = req.user;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project || project.deletedAt) {
      return res.status(404).json({
        errorCode: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      });
    }

    // Verify membership access
    if (role !== "ADMIN" && project.ownerId !== userId) {
      const isMember = project.members.some((m) => m.userId === userId);
      if (!isMember) {
        return res.status(403).json({
          errorCode: "FORBIDDEN",
          message: "You do not have access to view this project's activity timeline.",
        });
      }
    }

    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return res.status(200).json(activities);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  restoreProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  getProjectActivities,
};
