const express = require("express");
const cors = require("cors");
const http = require("http");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../swagger");

const { init } = require("./socket");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/comment.routes");
const notificationRoutes = require("./routes/notification.routes");
const taskRoutes = require("./routes/taskRoutes");
const healthRoutes = require("./routes/healthRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
init(server);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

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

// Auth Routes (Compatibility and V1)
app.use("/api/auth", authRoutes);
app.use("/api/v1/auth", authRoutes);

// User Routes (Compatibility and V1)
app.use("/api/users", userRoutes);
app.use("/api/v1/users", userRoutes);

// Tasks, Comments, Notifications, and Health V1 Routes
app.use("/api/v1/tasks", taskRoutes);
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