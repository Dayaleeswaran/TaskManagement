const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

const { isBlacklisted } = require("./tokenBlacklist");

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-change-me-in-production";

const verifyToken = async (req, res, next) => {
  try {
    let token = req.query.token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        errorCode: "UNAUTHORIZED",
        message: "Access token is missing or invalid.",
        details: null,
      });
    }

    // Check if token has been revoked / blacklisted (logout)
    if (isBlacklisted(token)) {
      return res.status(401).json({
        errorCode: "TOKEN_REVOKED",
        message: "This token has been invalidated. Please log in again.",
        details: null,
      });
    }

    // Pin algorithm to HS256 for secure verification
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({
        errorCode: "UNAUTHORIZED",
        message: "User account not found.",
        details: null,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        errorCode: "FORBIDDEN",
        message: "Your account has been deactivated.",
        details: null,
      });
    }

    // Attach user information to request object
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustResetPassword: user.mustResetPassword,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
      let errorCode = "UNAUTHORIZED";
      let message = "Authentication failed.";

      if (err.name === "TokenExpiredError") {
        errorCode = "TOKEN_EXPIRED";
        message = "Token has expired.";
      } else if (err.name === "JsonWebTokenError") {
        message = "Invalid token signature.";
      }

      return res.status(401).json({
        errorCode,
        message,
        details: err.message,
      });
    }

    // Pass database/network connection failures to central error handler as 500
    next(err);
  }
};

const checkPasswordReset = (req, res, next) => {
  if (req.user && req.user.mustResetPassword) {
    return res.status(403).json({
      errorCode: "PASSWORD_RESET_REQUIRED",
      message: "You must reset your password before accessing the system.",
      details: null,
    });
  }
  next();
};

module.exports = {
  verifyToken,
  checkPasswordReset,
};
