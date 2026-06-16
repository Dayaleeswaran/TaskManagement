const { z } = require("zod");

const RoleEnum = z.enum(["ADMIN", "PROJECT_MANAGER", "COLLABORATOR"]);

// Strong password policy (Min 8 chars, 1 uppercase, 1 number, 1 special character)
// Error message is generic to avoid revealing validation failures
const passwordPolicy = z.string().refine(
  (val) => {
    const hasMinLength = val.length >= 8;
    const hasUppercase = /[A-Z]/.test(val);
    const hasNumber = /[0-9]/.test(val);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(val);
    return hasMinLength && hasUppercase && hasNumber && hasSpecialChar;
  },
  {
    message: "Password does not meet complexity requirements.",
  }
);

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email format"),
  password: passwordPolicy,
  role: RoleEnum.default("COLLABORATOR"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

module.exports = {
  passwordPolicy,
  registerSchema,
  loginSchema,
};
