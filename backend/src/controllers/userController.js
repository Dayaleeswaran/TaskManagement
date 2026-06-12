const userService = require("../services/userService");

/**
 * Controller to create a new user.
 */
const createUserController = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
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

    // Authorization: Only admin can view other users' profiles
    if (req.user.role !== "ADMIN" && req.user.id !== id) {
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

    // Authorization: Users cannot edit other users' profiles
    if (req.user.role !== "ADMIN" && req.user.id !== id) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "You are not authorized to update this user profile.",
        details: null,
      });
    }

    // Prepare update data
    const updateData = { ...req.body };

    // Prevent non-admins from updating administrative fields
    if (req.user.role !== "ADMIN") {
      delete updateData.role;
      delete updateData.isActive;
    }

    const user = await userService.updateUser(id, updateData);
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

    // Prevent admin from deactivating themselves
    if (req.user.id === id) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "You cannot deactivate your own account.",
        details: null,
      });
    }

    const user = await userService.deactivateUser(id);
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

    // Prevent admin from changing their own role (optional safety check)
    if (req.user.id === id && req.user.role === "ADMIN" && role !== "ADMIN") {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "Administrators cannot change their own administrative role.",
        details: null,
      });
    }

    const user = await userService.assignRole(id, role);
    return res.status(200).json({
      message: "User role assigned successfully",
      user,
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
};
