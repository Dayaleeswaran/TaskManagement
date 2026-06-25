const bcrypt = require("bcrypt");
const prisma = require("../prisma");
const { sendWelcomeEmail } = require("./emailService");
const notificationService = require("./notificationService");

/**
 * Helper to remove password from user object.
 */
const excludePassword = (user) => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Creates a new user with a temporary password.
 */
const createUser = async (userData) => {
  const { name, email, role } = userData;

  // Check unique email
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    const error = new Error("Email already registered.");
    error.statusCode = 400;
    error.errorCode = "EMAIL_ALREADY_EXISTS";
    throw error;
  }

  // Generate a temporary password (8 chars + uppercase + number + symbol)
  const randStr = Math.random().toString(36).substring(2, 10);
  const tempPassword = `${randStr.charAt(0).toUpperCase()}${randStr.substring(1)}2026!`;
  
  // Hash password
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  // Save to DB
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      mustResetPassword: true,
      isActive: true,
    },
  });

  // Create welcome notification
  await notificationService.createNotification(
    user.id,
    "ACCOUNT_CREATED",
    "Your WorkNest account has been created."
  );

  // Send asynchronous welcome email notification
  sendWelcomeEmail(user.email, user.name, tempPassword).catch((err) => {
    console.error(`[Email Service] Failed to send email to ${user.email}:`, err);
  });

  return excludePassword(user);
};

/**
 * Fetch users using search, filtering, and pagination.
 */
const getAllUsers = async (filters) => {
  const { search, role, isActive, page = 1, limit = 10 } = filters;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Build prisma query filters
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(excludePassword),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Fetch a single user by ID.
 */
const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.errorCode = "USER_NOT_FOUND";
    throw error;
  }

  return excludePassword(user);
};

/**
 * Updates a user profile.
 */
const updateUser = async (id, updateData) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.errorCode = "USER_NOT_FOUND";
    throw error;
  }

  const dataToUpdate = {};

  if (updateData.name) dataToUpdate.name = updateData.name;

  if (updateData.email) {
    const emailLower = updateData.email.toLowerCase();
    if (emailLower !== user.email) {
      // Validate email uniqueness
      const existingUser = await prisma.user.findUnique({
        where: { email: emailLower },
      });
      if (existingUser) {
        const error = new Error("Email already registered by another user.");
        error.statusCode = 400;
        error.errorCode = "EMAIL_ALREADY_EXISTS";
        throw error;
      }
      dataToUpdate.email = emailLower;
    }
  }

  if (updateData.password) {
    dataToUpdate.password = await bcrypt.hash(updateData.password, 12);
    // If updating password explicitly, reset reset-flag if needed or reset it to false
    dataToUpdate.mustResetPassword = false;
  }

  if (updateData.isActive !== undefined) {
    dataToUpdate.isActive = updateData.isActive;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: dataToUpdate,
  });

  return excludePassword(updatedUser);
};

/**
 * Deactivates (soft deletes) a user.
 */
const deactivateUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.errorCode = "USER_NOT_FOUND";
    throw error;
  }

  const deactivated = await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return excludePassword(deactivated);
};

/**
 * Updates a user's role.
 */
const assignRole = async (id, role) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.errorCode = "USER_NOT_FOUND";
    throw error;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
  });

  return excludePassword(updated);
};

/**
 * Hard deletes a user completely from the database.
 */
const deleteUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.errorCode = "USER_NOT_FOUND";
    throw error;
  }

  const deleted = await prisma.user.delete({
    where: { id },
  });

  return excludePassword(deleted);
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  deleteUser,
  assignRole,
};
