const prisma = require("../prisma");

/**
 * Controller to perform global search across Users, Projects, and Tasks with role access verification.
 */
const performSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    const { role, id: userId } = req.user;
    
    if (!q || !q.trim()) {
      return res.status(200).json({ users: [], projects: [], tasks: [] });
    }
    
    const searchString = q.trim();

    // 1. Search Users (Admin can search all users, PMs/Collaborators can search active users)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchString, mode: "insensitive" } },
          { email: { contains: searchString, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      take: 10,
    });

    // 2. Search Projects based on User Role access
    const projectWhere = {
      name: { contains: searchString, mode: "insensitive" },
      deletedAt: null,
    };
    
    if (role === "PROJECT_MANAGER") {
      projectWhere.ownerId = userId;
    } else if (role === "COLLABORATOR") {
      projectWhere.OR = [
        { ownerId: userId },
        { members: { some: { userId } } },
      ];
    }
    
    const projects = await prisma.project.findMany({
      where: projectWhere,
      take: 10,
    });

    // 3. Search Tasks based on User Role access
    const taskWhere = {
      OR: [
        { title: { contains: searchString, mode: "insensitive" } },
        { description: { contains: searchString, mode: "insensitive" } },
      ],
      deletedAt: null,
    };

    if (role === "PROJECT_MANAGER") {
      taskWhere.project = { ownerId: userId };
    } else if (role === "COLLABORATOR") {
      taskWhere.OR = [
        { assignments: { some: { userId } } },
        { project: { members: { some: { userId } } } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 15,
    });

    return res.status(200).json({
      users,
      projects,
      tasks,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  performSearch,
};
