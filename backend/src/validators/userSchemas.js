const { z } = require("zod");
const { passwordPolicy } = require("./authSchemas");

const RoleEnum = z.enum(["ADMIN", "PROJECT_MANAGER", "COLLABORATOR"]);

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email format"),
  role: RoleEnum.default("COLLABORATOR"),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long").optional(),
  email: z.string().email("Invalid email format").optional(),
  password: passwordPolicy.optional(),
  isActive: z.boolean().optional(),
});

const assignRoleSchema = z.object({
  role: RoleEnum,
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
};
