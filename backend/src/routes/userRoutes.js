const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const {
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
} = require("../validators/userSchemas");
const {
  createUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deactivateUserController,
  assignRoleController,
} = require("../controllers/userController");

const router = express.Router();

// All user routes require token verification
router.use(verifyToken);

// Admin-only: Create user
router.post(
  "/",
  requireRole("ADMIN"),
  validate(createUserSchema),
  createUserController
);

// Admin-only: List users with search, pagination, filtering
router.get(
  "/",
  requireRole("ADMIN"),
  getAllUsersController
);

// Get specific user profile (Admin or self)
router.get(
  "/:id",
  getUserByIdController
);

// Update specific user profile (Admin or self)
router.put(
  "/:id",
  validate(updateUserSchema),
  updateUserController
);

// Admin-only: Deactivate (soft delete) user
router.delete(
  "/:id",
  requireRole("ADMIN"),
  deactivateUserController
);

// Admin-only: Update user role
router.patch(
  "/:id/role",
  requireRole("ADMIN"),
  validate(assignRoleSchema),
  assignRoleController
);

module.exports = router;
