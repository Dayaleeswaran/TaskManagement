const express = require("express");
const cors = require("cors");
const http = require("http");
const { init } = require("./socket");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const commentRoutes = require("./routes/comment.routes");
const notificationRoutes = require("./routes/notification.routes");
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

app.get("/", (req, res) => {
  res.send("Task Management API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/v1", commentRoutes);
app.use("/api/v1", notificationRoutes);

// Centralized Error Handler (must be registered after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});