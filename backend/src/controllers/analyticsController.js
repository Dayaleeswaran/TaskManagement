const prisma = require("../prisma");

/**
 * Controller to fetch dashboard analytics custom-tailored to the user's role.
 * Matches Business Logic 12 specifications.
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;

    // 1. SUPER_ADMIN: Total Users, Active Users, Total Projects, Total Tasks, Audit Logs Count
    if (role === "SUPER_ADMIN") {
      const [
        totalUsers,
        activeUsers,
        projects,
        tasks,
        auditLogsCount
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.project.count({ where: { deletedAt: null } }),
        prisma.task.count({ where: { deletedAt: null } }),
        prisma.auditLog.count(),
      ]);

      return res.status(200).json({
        totalUsers,
        activeUsers,
        projects,
        tasks,
        auditLogsCount,
      });
    }

    // 2. ADMIN: Users, Projects, Tasks
    if (role === "ADMIN") {
      const [
        totalUsers,
        projects,
        tasks
      ] = await Promise.all([
        prisma.user.count(),
        prisma.project.count({ where: { deletedAt: null } }),
        prisma.task.count({ where: { deletedAt: null } }),
      ]);

      return res.status(200).json({
        totalUsers, // Users
        projects,   // Projects
        tasks,      // Tasks
      });
    }

    // 3. PROJECT_MANAGER: My Projects, Team Members, Active Tasks, Overdue Tasks
    if (role === "PROJECT_MANAGER") {
      const pmProjects = await prisma.project.findMany({
        where: { ownerId: userId, deletedAt: null },
        select: { id: true },
      });
      const pmProjectIds = pmProjects.map((p) => p.id);
      const myProjects = pmProjects.length;

      const [
        projectMembers,
        activeTasks,
        overdueTasks
      ] = await Promise.all([
        prisma.projectMember.findMany({
          where: { projectId: { in: pmProjectIds } },
          select: { userId: true },
        }),
        prisma.task.count({
          where: {
            projectId: { in: pmProjectIds },
            status: { not: "COMPLETED" },
            deletedAt: null,
          },
        }),
        prisma.task.count({
          where: {
            projectId: { in: pmProjectIds },
            dueDate: { lt: new Date() },
            status: { not: "COMPLETED" },
            deletedAt: null,
          },
        }),
      ]);

      const uniqueMembers = new Set(projectMembers.map((m) => m.userId));
      const teamMembers = uniqueMembers.size;

      return res.status(200).json({
        myProjects,
        teamMembers,
        activeTasks,
        overdueTasks,
      });
    }

    // 4. COLLABORATOR: Assigned Tasks, Due Today, Completed Tasks
    if (role === "COLLABORATOR") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const [
        assignedTasks,
        dueToday,
        completedTasks
      ] = await Promise.all([
        prisma.task.count({
          where: {
            assignments: { some: { userId } },
            deletedAt: null,
          },
        }),
        prisma.task.count({
          where: {
            assignments: { some: { userId } },
            dueDate: { gte: startOfToday, lte: endOfToday },
            deletedAt: null,
          },
        }),
        prisma.task.count({
          where: {
            assignments: { some: { userId } },
            status: "COMPLETED",
            deletedAt: null,
          },
        }),
      ]);

      return res.status(200).json({
        assignedTasks,
        dueToday,
        completedTasks,
      });
    }

    return res.status(400).json({ errorCode: "BAD_REQUEST", message: "Invalid role structure." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardAnalytics,
};
