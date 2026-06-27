const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const crypto = require("crypto");
const { addToBlacklist } = require("../middleware/tokenBlacklist");
const { sendPasswordResetCode } = require("../services/emailService");

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

    // Sign Access Token - Lifetime: 15 minutes (HS256)
    const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "15m",
      algorithm: "HS256",
    });

    // Generate Refresh Token - cryptographically strong string
    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save refresh token record
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
        userAgent: req.headers["user-agent"] || null,
      },
    });

    // Set Refresh Token as HttpOnly Secure cookie
    res.cookie("refreshToken", rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiresAt,
      path: "/",
    });

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
      token: accessToken,
      user: userResponse,
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    if (!rawRefreshToken) {
      return res.status(401).json({
        errorCode: "REFRESH_TOKEN_MISSING",
        message: "Refresh token is missing.",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // If token not found, expired, or revoked
    if (!tokenRecord || tokenRecord.revokedAt || new Date() > tokenRecord.expiresAt) {
      return res.status(401).json({
        errorCode: "UNAUTHORIZED",
        message: "Invalid or expired refresh token.",
      });
    }

    if (!tokenRecord.user.isActive) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Your account has been deactivated.",
      });
    }

    // Revoke previous token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Rotate: Generate new refresh token
    const newRawRefreshToken = crypto.randomBytes(40).toString("hex");
    const newHash = crypto.createHash("sha256").update(newRawRefreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        tokenHash: newHash,
        expiresAt,
        ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
        userAgent: req.headers["user-agent"] || null,
      },
    });

    // Generate new Access Token (15m, HS256)
    const newAccessToken = jwt.sign({ id: tokenRecord.userId }, JWT_SECRET, {
      expiresIn: "15m",
      algorithm: "HS256",
    });

    // Set cookie
    res.cookie("refreshToken", newRawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiresAt,
      path: "/",
    });

    res.status(200).json({
      token: newAccessToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
      
      // Revoke in DB
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    }

    // Add access token to blacklist if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      addToBlacklist(token);
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const emailLower = email.toLowerCase();

    // Check if the email exists in the database
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    // Return a clear error if the email is not registered
    if (!user) {
      return res.status(404).json({
        errorCode: "EMAIL_NOT_FOUND",
        message: "No account found with this email address.",
      });
    }

    // Email exists — generate a random 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode: code,
        resetCodeExpiry: expiry,
        resetCodeAttempts: 0,
      },
    });

    sendPasswordResetCode(user.email, code).catch((err) => {
      console.error(`[Email Service] Failed to send reset code to ${user.email}:`, err);
    });

    return res.status(200).json({
      message: "Verification code sent successfully. Please check your email.",
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const emailLower = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "Invalid or expired verification code.",
      });
    }

    // Check failed attempts protection
    if (user.resetCodeAttempts >= 5) {
      return res.status(400).json({
        errorCode: "TOO_MANY_FAILED_ATTEMPTS",
        message: "Too many failed attempts. Please request a new verification code.",
      });
    }

    // Validate code presence, correctness, and expiration
    if (!user.resetCode || user.resetCode !== code || !user.resetCodeExpiry || new Date() > user.resetCodeExpiry) {
      // Increment attempt counter on mismatch
      await prisma.user.update({
        where: { id: user.id },
        data: { resetCodeAttempts: { increment: 1 } },
      });

      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "Invalid or expired verification code.",
      });
    }

    return res.status(200).json({
      message: "Verification successful.",
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const emailLower = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "Invalid or expired verification code.",
      });
    }

    // Verify attempts
    if (user.resetCodeAttempts >= 5) {
      return res.status(400).json({
        errorCode: "TOO_MANY_FAILED_ATTEMPTS",
        message: "Too many failed attempts. Please request a new verification code.",
      });
    }

    // Verify code and expiration again
    if (!user.resetCode || user.resetCode !== code || !user.resetCodeExpiry || new Date() > user.resetCodeExpiry) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "Invalid or expired verification code.",
      });
    }

    // Password complexity check
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    if (!(hasMinLength && hasUppercase && hasNumber && hasSpecialChar)) {
      return res.status(400).json({
        errorCode: "BAD_REQUEST",
        message: "Password does not meet complexity requirements.",
      });
    }

    // Hash password and save
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiry: null,
        resetCodeAttempts: 0,
        mustResetPassword: false, // Clearing any reset flags on successful password update
      },
    });

    return res.status(200).json({
      message: "Password reset successfully.",
    });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
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