const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const prisma = require("./prisma");

let io;

/**
 * Initialize Socket.io on the provided HTTP server.
 * @param {object} server - The HTTP server instance.
 * @returns {Server} The initialized socket.io server instance.
 */
const init = (server) => {
  const clientOrigin = process.env.CLIENT_ORIGIN;
  const allowedOrigins = clientOrigin
    ? clientOrigin.split(",").map((o) => o.trim()).filter(Boolean)
    : [];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  // Authentication Middleware for WebSocket Connection
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    const tokenString = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-change-me-in-production";

    try {
      const decoded = jwt.verify(tokenString, JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    if (userId) {
      // User room join pattern: socket.join(userId) on connection
      socket.join(userId);
      console.log(`[Socket.io] User ${userId} connected and joined room: ${userId}`);

      // Offline users: deliver unread notifications stored in DB on reconnect
      try {
        const unreadNotifications = await prisma.notification.findMany({
          where: {
            userId: userId,
            isRead: false,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        unreadNotifications.forEach((notification) => {
          socket.emit("notification", notification);
        });

        if (unreadNotifications.length > 0) {
          console.log(`[Socket.io] Delivered ${unreadNotifications.length} cached notifications to offline User ${userId}`);
        }
      } catch (err) {
        console.error(`[Socket.io] Failed to deliver offline notifications to User ${userId}:`, err);
      }
    }

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Socket disconnected: ${socket.id} (User: ${userId || "Guest"})`);
    });
  });

  return io;
};

/**
 * Retrieve the active Socket.io Server instance.
 * @returns {Server}
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};

module.exports = {
  init,
  getIO,
};
