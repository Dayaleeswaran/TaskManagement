const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-change-me-in-production";

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        errorCode: "UNAUTHORIZED",
        message: "Access token is missing or invalid.",
        details: null,
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

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
};

module.exports = {
  verifyToken,
};
