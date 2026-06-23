const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { addToBlacklist } = require("../middleware/tokenBlacklist");

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-change-me-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!email || !password || !name) {
      const error = new Error("Name, email, and password are required.");
      error.statusCode = 400;
      error.errorCode = "BAD_REQUEST";
      throw error;
    }

    const emailLower = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      const error = new Error("User already exists.");
      error.statusCode = 400;
      error.errorCode = "EMAIL_ALREADY_EXISTS";
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        password: hashedPassword,
        role,
        mustResetPassword: true,
        isActive: true,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required.");
      error.statusCode = 400;
      error.errorCode = "BAD_REQUEST";
      throw error;
    }

    const emailLower = email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      const error = new Error("Invalid credentials.");
      error.statusCode = 401;
      error.errorCode = "UNAUTHORIZED";
      throw error;
    }

    if (!user.isActive) {
      const error = new Error("Your account has been deactivated.");
      error.statusCode = 403;
      error.errorCode = "FORBIDDEN";
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error("Invalid credentials.");
      error.statusCode = 401;
      error.errorCode = "UNAUTHORIZED";
      throw error;
    }

    // Sign JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Don't return the hashed password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustResetPassword: user.mustResetPassword,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      addToBlacklist(token);
    }
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      const error = new Error("New password is required.");
      error.statusCode = 400;
      error.errorCode = "BAD_REQUEST";
      throw error;
    }

    // Validate password complexity
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    if (!(hasMinLength && hasUppercase && hasNumber && hasSpecialChar)) {
      const error = new Error("Password does not meet complexity requirements.");
      error.statusCode = 400;
      error.errorCode = "BAD_REQUEST";
      throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: hashedPassword,
        mustResetPassword: false,
      },
    });

    return res.status(200).json({
      message: "Password reset successfully. You now have full access.",
    });
  } catch (err) {
    next(err);
  }
};