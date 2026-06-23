const prisma = require("../prisma");

/**
 * Controller to fetch dashboard analytics custom-tailored to the user's role.
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    
    if (role === "ADMIN") {
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({ where: { isActive: true } });
      const projects = await prisma.project.count({ where: { deletedAt: null } });
      const totalTasks = await prisma.task.count({ where: { deletedAt: null } });
      
      const completedTasks = await prisma.task.count({
        where: { status: "COMPLETED", deletedAt: null },
      });
      
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return res.status(200).json({
        totalUsers,
        activeUsers,
        projects,
        tasks: totalTasks,
        completionRate,
      });
    } 
    
    if (role === "PROJECT_MANAGER") {
      const activeProjects = await prisma.project.count({
        where: { ownerId: userId, deletedAt: null },
      });
      
      const pmProjects = await prisma.project.findMany({
        where: { ownerId: userId, deletedAt: null },
        select: { id: true },
      });
      const pmProjectIds = pmProjects.map((p) => p.id);
      
      // Distinct counts of users registered to the PM's projects
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: { in: pmProjectIds } },
        select: { userId: true },
      });
      const uniqueMembers = new Set(projectMembers.map((m) => m.userId));
      const teamMembers = uniqueMembers.size;
      
      const tasksCompleted = await prisma.task.count({
        where: {
          projectId: { in: pmProjectIds },
          status: "COMPLETED",
          deletedAt: null,
        },
      });
      
      const overdueTasks = await prisma.task.count({
        where: {
          projectId: { in: pmProjectIds },
          dueDate: { lt: new Date() },
          status: { not: "COMPLETED" },
          deletedAt: null,
        },
      });
      
      return res.status(200).json({
        activeProjects,
        teamMembers,
        tasksCompleted,
        overdueTasks,
      });
    }
    
    if (role === "COLLABORATOR") {
      const myTasks = await prisma.task.count({
        where: {
          assignments: { some: { userId } },
          deletedAt: null,
        },
      });
      
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      
      const dueToday = await prisma.task.count({
        where: {
          assignments: { some: { userId } },
          dueDate: { gte: startOfToday, lte: endOfToday },
          deletedAt: null,
        },
      });
      
      const overdue = await prisma.task.count({
        where: {
          assignments: { some: { userId } },
          dueDate: { lt: new Date() },
          status: { not: "COMPLETED" },
          deletedAt: null,
        },
      });
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const completedThisMonth = await prisma.task.count({
        where: {
          assignments: { some: { userId } },
          status: "COMPLETED",
          updatedAt: { gte: startOfMonth },
          deletedAt: null,
        },
      });
      
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
