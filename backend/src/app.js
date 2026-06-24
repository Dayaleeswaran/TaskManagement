require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../swagger");
const path = require("path");

const { init } = require("./socket");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/comment.routes");
const notificationRoutes = require("./routes/notification.routes");
const taskRoutes = require("./routes/taskRoutes");
const projectRoutes = require("./routes/projectRoutes");
const healthRoutes = require("./routes/healthRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const searchRoutes = require("./routes/searchRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const { seedDefaultLabels } = require("./services/labelSeeder");
const { seedSuperAdmin } = require("./services/superAdminSeeder");
const { errorHandler } = require("./middleware/errorHandler");
const { sanitizeInput } = require("./middleware/sanitizeMiddleware");

const app = express();

// Production-grade CORS setup
const clientOrigin = process.env.CLIENT_ORIGIN;
const rawOrigins = clientOrigin
  ? clientOrigin.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

// Automatically allow the port-less default origin if a default port is specified
const extraOrigins = [];
rawOrigins.forEach((origin) => {
  if (origin.startsWith("http://") && origin.endsWith(":80")) {
    extraOrigins.push(origin.slice(0, -3));
  } else if (origin.startsWith("https://") && origin.endsWith(":443")) {
    extraOrigins.push(origin.slice(0, -4));
  }
});
const allowedOrigins = [...rawOrigins, ...extraOrigins];

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  console.warn("WARNING: NODE_ENV is set to 'production' but CLIENT_ORIGIN is not defined or is empty!");
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, postman, server-to-server)
    // or if we are not in production environment
    if (!origin || process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle HTTP OPTIONS preflight requests explicitly for all routes
app.options("*path", cors(corsOptions));

// Secure application by setting various HTTP headers (OWASP Hardening)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https://validator.swagger.io"],
      connectSrc: ["'self'", "*", "wss://*", "ws://*"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: {
    action: "deny",
  },
  xssFilter: true,
  hidePoweredBy: true,
}));

app.use(express.json());
app.use(sanitizeInput);

// Global Rate limiting middleware to prevent brute-force/DoS attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 100000, // Limit each IP to 100 requests in prod, virtually unlimited in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    errorCode: "TOO_MANY_REQUESTS",
    message: "Too many requests from this IP, please try again after 15 minutes.",
    details: null,
  }
});

// Stricter rate limiter for authentication/login routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 10 : 100000, // Limit each IP to 10 requests in prod, virtually unlimited in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    errorCode: "TOO_MANY_AUTH_ATTEMPTS",
    message: "Too many authentication attempts, please try again after 15 minutes.",
    details: null,
  }
});

// Apply strict rate limiting to auth endpoints
app.use("/api/auth", authLimiter);
app.use("/api/v1/auth", authLimiter);

// Apply global rate limiter to all other API routes
app.use("/api", apiLimiter);

const server = http.createServer(app);

// Initialize Socket.io
init(server);


// Mount Swagger Documentation Route
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

app.get("/", (req, res) => {
  res.send("Task Management API Running. Swagger docs available at /api/docs");
});

// Run default labels seeder check on startup
seedDefaultLabels();
seedSuperAdmin();



// Auth Routes (Compatibility and V1)
app.use("/api/auth", authRoutes);
app.use("/api/v1/auth", authRoutes);

// User Routes (Compatibility and V1)
app.use("/api/users", userRoutes);
app.use("/api/v1/users", userRoutes);

// Tasks, Comments, Notifications, and Health V1 Routes
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1", commentRoutes);
app.use("/api/v1", notificationRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/v1/health", healthRoutes);

// Centralized Error Handler (must be registered after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});