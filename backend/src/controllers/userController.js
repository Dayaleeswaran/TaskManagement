const userService = require("../services/userService");
const prisma = require("../prisma");
const auditService = require("../services/auditService");

/**
 * Controller to create a new user.
 */
const createUserController = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Admin restriction: Admins can only manage Project Managers and Collaborators.
    if (req.user.role === "ADMIN") {
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        return res.status(403).json({
          errorCode: "FORBIDDEN",
          message: "Administrators cannot create Admin or Super Admin users.",
        });
      }
    }

    if (role === "SUPER_ADMIN") {
      const existingSuperAdmin = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
      });
      if (existingSuperAdmin) {
        return res.status(400).json({
          errorCode: "BAD_REQUEST",
          message: "A Super Admin already exists in the system.",
        });
      }
    }

    const user = await userService.createUser(req.body);
    await auditService.log(
      "USER_CREATE",
      req.user.id,
      user.id,
      { name: user.name, email: user.email, role: user.role }
    );
    return res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to get all users.
 */
const getAllUsersController = async (req, res, next) => {
  try {
    const { users, pagination } = await userService.getAllUsers(req.query);
    return res.status(200).json({
      users,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to get a single user by ID.
 */
const getUserByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Authorization: Only admin/super-admin can view other users' profiles
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN" && req.user.id !== id) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "You are not authorized to view this user profile.",
        details: null,
      });
    }

    const user = await userService.getUserById(id);
    return res.status(200).json({
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to update user details.
 */
const updateUserController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Retrieve target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({
        errorCode: "USER_NOT_FOUND",
        message: "User not found.",
      });
    }

    // Authorization: Users cannot edit other users' profiles unless admin or super admin
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN" && req.user.id !== id) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "You are not authorized to update this user profile.",
        details: null,
      });
    }

    // Admins cannot edit Super Admin profiles
    if (targetUser.role === "SUPER_ADMIN" && req.user.role === "ADMIN") {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Administrators cannot edit the Super Admin profile.",
      });
    }

    // Admins cannot edit other Admin profiles (admins can only manage PMs and Collaborators)
    if (targetUser.role === "ADMIN" && req.user.role === "ADMIN" && req.user.id !== id) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Administrators cannot edit other Admin profiles.",
      });
    }

    // Super Admin protections: Cannot have role changed, cannot be deactivated
    if (targetUser.role === "SUPER_ADMIN") {
      if (req.body.role && req.body.role !== "SUPER_ADMIN") {
        return res.status(400).json({
          errorCode: "BAD_REQUEST",
          message: "Super Admin role cannot be changed.",
        });
      }
      if (req.body.isActive === false) {
        return res.status(400).json({
          errorCode: "BAD_REQUEST",
          message: "Super Admin cannot be deactivated.",
        });
      }
    }

    // Admin restrictions on assigning role or status
    if (req.user.role === "ADMIN") {
      if (req.body.role && (req.body.role === "ADMIN" || req.body.role === "SUPER_ADMIN")) {
        return res.status(403).json({
          errorCode: "FORBIDDEN",
          message: "Administrators cannot assign Admin or Super Admin roles.",
        });
      }
    }

    // Prepare update data
    const updateData = { ...req.body };

    // Prevent non-admins/non-super-admins from updating administrative fields
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      delete updateData.role;
      delete updateData.isActive;
    }

    const user = await userService.updateUser(id, updateData);
    if (req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN") {
      if (updateData.isActive === true) {
        await auditService.log(
          "USER_ACTIVATE",
          req.user.id,
          user.id,
          { name: user.name, email: user.email }
        );
      } else {
        await auditService.log(
          "USER_UPDATE",
          req.user.id,
          user.id,
          { name: user.name, email: user.email, updatedFields: Object.keys(updateData) }
        );
      }
    }
    return res.status(200).json({
      message: "User profile updated successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to deactivate (soft delete) a user.
 */
const deactivateUserController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deactivating self
    if (req.user.id === id) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "You cannot deactivate your own account.",
        details: null,
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({
        errorCode: "USER_NOT_FOUND",
        message: "User not found.",
      });
    }

    // Super Admin protections: Cannot be deactivated or deleted
    if (targetUser.role === "SUPER_ADMIN") {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "Super Admin account cannot be deactivated or deleted.",
      });
    }

    // Admin restrictions: cannot deactivate other Admins or Super Admins
    if (req.user.role === "ADMIN") {
      if (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN") {
        return res.status(403).json({
          errorCode: "FORBIDDEN",
          message: "Administrators cannot deactivate other Admin or Super Admin accounts.",
        });
      }
    }

    const user = await userService.deactivateUser(id);
    await auditService.log(
      "USER_DEACTIVATE",
      req.user.id,
      user.id,
      { name: user.name, email: user.email, role: user.role }
    );
    return res.status(200).json({
      message: "User account deactivated successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to assign role to a user.
 */
const assignRoleController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({
        errorCode: "USER_NOT_FOUND",
        message: "User not found.",
      });
    }

    // Super Admin protections: Cannot have role changed
    if (targetUser.role === "SUPER_ADMIN") {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "Super Admin role cannot be changed.",
      });
    }

    // Admin restrictions
    if (req.user.role === "ADMIN") {
      // Admins cannot change roles of other Admins or Super Admin
      if (targetUser.role === "ADMIN" || targetUser.role === "SUPER_ADMIN") {
        return res.status(403).json({
          errorCode: "FORBIDDEN",
          message: "Administrators cannot modify roles for Admin or Super Admin accounts.",
        });
      }
      // Admins cannot promote to Admin or Super Admin
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        return res.status(403).json({
          errorCode: "FORBIDDEN",
          message: "Administrators cannot assign Admin or Super Admin roles.",
        });
      }
    }

    // Prevent changing own administrative role
    if (req.user.id === id) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "You cannot modify your own administrative role.",
      });
    }

    // If new role is SUPER_ADMIN, check if one already exists
    if (role === "SUPER_ADMIN") {
      const existingSuperAdmin = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
      });
      if (existingSuperAdmin) {
        return res.status(400).json({
          errorCode: "BAD_REQUEST",
          message: "A Super Admin already exists in the system.",
        });
      }
    }

    const user = await userService.assignRole(id, role);
    await auditService.log(
      "USER_ROLE_ASSIGN",
      req.user.id,
      user.id,
      { name: user.name, email: user.email, role }
    );
    return res.status(200).json({
      message: "User role assigned successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};

const getAuditLogsController = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Only administrators can view audit logs.",
      });
    }

    const { page = 1, limit = 10, search = "" } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search && search.trim()) {
      where.OR = [
        { action: { contains: search.trim(), mode: "insensitive" } },
        { performer: { name: { contains: search.trim(), mode: "insensitive" } } },
        { performer: { email: { contains: search.trim(), mode: "insensitive" } } },
      ];
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: {
          performer: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deactivateUserController,
  assignRoleController,
  getAuditLogsController,
};
