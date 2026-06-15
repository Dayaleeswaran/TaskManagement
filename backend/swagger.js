const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Management System API",
      version: "1.0.0",
      description: "Complete REST API documentation for the Task Management System.",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token to authorize requests. Enter only the token string.",
        },
      },
      schemas: {
        UserSchema: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["ADMIN", "PROJECT_MANAGER", "COLLABORATOR"] },
            isActive: { type: "boolean" },
            mustResetPassword: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        TaskSchema: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ["TODO", "IN_PROGRESS", "COMPLETED"] },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            dueDate: { type: "string", format: "date-time" },
            projectId: { type: "string", format: "uuid" },
            createdById: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CommentSchema: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            body: { type: "string" },
            taskId: { type: "string", format: "uuid" },
            authorId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        NotificationSchema: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            type: { type: "string" },
            message: { type: "string" },
            isRead: { type: "boolean" },
            userId: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ErrorResponseSchema: {
          type: "object",
          properties: {
            errorCode: { type: "string" },
            message: { type: "string" },
            details: { type: "object", nullable: true },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
