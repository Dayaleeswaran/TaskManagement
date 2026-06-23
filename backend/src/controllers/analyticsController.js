const prisma = require("../prisma");

/**
 * Controller to fetch dashboard analytics custom-tailored to the user's role.
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      const [
        totalUsers,
        activeUsers,
        projects,
        totalTasks,
        completedTasks,
        overdueTasks
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.project.count({ where: { deletedAt: null } }),
        prisma.task.count({ where: { deletedAt: null } }),
        prisma.task.count({ where: { status: "COMPLETED", deletedAt: null } }),
        prisma.task.count({
          where: {
            dueDate: { lt: new Date() },
            status: { not: "COMPLETED" },
            deletedAt: null,
          },
        })
      ]);
      
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return res.status(200).json({
        totalUsers,
        activeUsers,
        projects,
        tasks: totalTasks,
        completionRate,
        overdueTasks,
      });
    } 
    
    if (role === "PROJECT_MANAGER") {
      const pmProjects = await prisma.project.findMany({
        where: { ownerId: userId, deletedAt: null },
        select: { id: true },
      });
      const pmProjectIds = pmProjects.map((p) => p.id);
      const activeProjects = pmProjects.length;
      
      const [
        projectMembers,
        tasksCompleted,
        overdueTasks
      ] = await Promise.all([
        prisma.projectMember.findMany({
          where: { projectId: { in: pmProjectIds } },
          select: { userId: true },
        }),
        prisma.task.count({
          where: {
            projectId: { in: pmProjectIds },
            status: "COMPLETED",
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
        })
      ]);
      
      const uniqueMembers = new Set(projectMembers.map((m) => m.userId));
      const teamMembers = uniqueMembers.size;
      
      return res.status(200).json({
        activeProjects,
        teamMembers,
        tasksCompleted,
        overdueTasks,
      });
    }
    
    if (role === "COLLABORATOR") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const [
        myTasks,
        dueToday,
        overdue,
        completedThisMonth
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
            dueDate: { lt: new Date() },
            status: { not: "COMPLETED" },
            deletedAt: null,
          },
        }),
        prisma.task.count({
          where: {
            assignments: { some: { userId } },
            status: "COMPLETED",
            updatedAt: { gte: startOfMonth },
            deletedAt: null,
          },
        })
      ]);
      
      return res.status(200).json({
        myTasks,
        dueToday,
        overdue,
        completedThisMonth,
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
