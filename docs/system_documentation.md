# WorkNest — Complete System Documentation

> **Task Management System** | Full-Stack Web Application
> GitHub: [Dayaleeswaran/TaskManagement](https://github.com/Dayaleeswaran/TaskManagement)

---

## Table of Contents
1. [Source Code Structure](#1-source-code-structure)
2. [API Documentation](#2-api-documentation)
3. [Database Design](#3-database-design)
4. [ER Diagram](#4-er-diagram)
5. [Class Diagrams](#5-class-diagrams)
6. [Deployment Diagram](#6-deployment-diagram)

---

## 1. Source Code Structure

### Repository Layout
```
TaskManagement/
├── backend/                    # Node.js + Express REST API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (ORM models)
│   │   ├── seed.js             # Database seed script
│   │   └── migrations/         # Prisma migration history
│   ├── src/
│   │   ├── app.js              # Express app entry + route mounts
│   │   ├── socket.js           # Socket.io server initialization
│   │   ├── prisma.js           # Prisma client singleton
│   │   ├── controllers/        # Route handler logic
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   ├── commentController.js
│   │   │   ├── notificationController.js
│   │   │   ├── settingsController.js
│   │   │   ├── analyticsController.js
│   │   │   ├── searchController.js
│   │   │   ├── attachment.controller.js
│   │   │   └── healthController.js
│   │   ├── routes/             # Express route definitions (with Swagger JSDoc)
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   ├── comment.routes.js
│   │   │   ├── notification.routes.js
│   │   │   ├── settingsRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── searchRoutes.js
│   │   │   ├── attachment.routes.js
│   │   │   └── healthRoutes.js
│   │   ├── services/           # Business logic layer
│   │   │   ├── notificationService.js  # Preference-aware notification engine
│   │   │   ├── commentService.js
│   │   │   ├── activityService.js
│   │   │   ├── auditService.js
│   │   │   ├── attachment.service.js
│   │   │   ├── labelSeeder.js
│   │   │   └── superAdminSeeder.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # JWT verify + password reset gate
│   │   │   ├── errorHandler.js         # Centralised error handler
│   │   │   ├── sanitizeMiddleware.js   # Input sanitization
│   │   │   └── validateMiddleware.js   # Joi schema validation
│   │   ├── validators/
│   │   │   └── authSchemas.js          # Joi validation schemas
│   │   └── utils/
│   │       └── dbQueries.js            # Reusable Prisma query helpers
│   ├── swagger.js              # Swagger/OpenAPI spec config
│   ├── Dockerfile              # Dev Docker image
│   ├── Dockerfile.prod         # Production Docker image
│   └── .env                    # Environment config
│
├── frontend/                   # React 18 + Vite SPA
│   ├── src/
│   │   ├── main.jsx            # React entry point
│   │   ├── App.jsx             # Router + protected route setup
│   │   ├── index.css           # Global CSS design system
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── MyTasks.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Users.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── AuditLogs.jsx
│   │   ├── components/
│   │   │   ├── MainLayout.jsx          # App shell + sidebar
│   │   │   ├── TaskDetailModal.jsx     # Task detail + comments + attachments
│   │   │   ├── CreateTaskModal.jsx     # Task creation form
│   │   │   ├── KanbanBoard.jsx         # Drag-and-drop Kanban
│   │   │   ├── NotificationItem.jsx    # Notification list item
│   │   │   └── ProtectedRoute.jsx      # Auth guard wrapper
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # User session + token state
│   │   │   ├── NotificationContext.jsx  # Notification state + actions
│   │   │   └── ToastContext.jsx         # Global toast notifications
│   │   ├── hooks/
│   │   │   └── useSocket.js             # Socket.io client hook
│   │   ├── services/
│   │   │   └── api.js                   # Axios instance + interceptors
│   │   └── utils/
│   │       └── dateUtils.js             # Date formatting helpers
│   ├── Dockerfile              # Dev Docker image
│   ├── Dockerfile.prod         # Production Docker image (Nginx)
│   └── .env                    # Vite environment config
│
├── docker-compose.yml          # Local development compose
├── docker-compose.prod.yml     # Production compose
├── nginx.conf                  # Nginx reverse proxy + static serving
└── README.md
```

**Tech Stack**

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Vanilla CSS |
| Backend | Node.js 20, Express 5 |
| ORM | Prisma 6 |
| Database | PostgreSQL 15 (Supabase hosted) |
| File Storage | Supabase Storage (S3-compatible) |
| Real-time | Socket.io 4 |
| Auth | JWT (access) + HttpOnly cookie (refresh) |
| API Docs | Swagger UI / OpenAPI 3.0 |
| Containers | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions |

---

## 2. API Documentation

> **Live Swagger UI**: `http://localhost:3000/api/docs`

### Base URL
```
Development:  http://localhost:3000/api/v1
Production:   https://<your-domain>/api/v1
```

### Authentication
All protected routes require:
```
Authorization: Bearer <access_token>
```
Access tokens expire in 1h. Use `/api/v1/auth/refresh` (HttpOnly cookie) to rotate.

---

### 2.1 Auth Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | ❌ | Authenticate user, receive access token |
| `POST` | `/auth/register` | ❌ | Register new user account |
| `POST` | `/auth/logout` | ✅ | Revoke refresh token |
| `POST` | `/auth/refresh` | Cookie | Rotate refresh token, get new access token |
| `POST` | `/auth/forgot-password` | ❌ | Request password reset code |
| `POST` | `/auth/verify-reset-code` | ❌ | Verify reset code |
| `POST` | `/auth/reset-password` | ❌ | Set new password using reset code |
| `POST` | `/auth/change-password` | ✅ | Change password when logged in |

**POST /auth/login** Request:
```json
{ "email": "user@example.com", "password": "secret" }
```
**Response 200:**
```json
{ "token": "<jwt>", "user": { "id": "uuid", "name": "...", "role": "COLLABORATOR" } }
```

---

### 2.2 Users Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/users` | ✅ | All | List all active users |
| `POST` | `/users` | ✅ | ADMIN, SUPER_ADMIN | Create new user |
| `GET` | `/users/:id` | ✅ | All | Get user by ID |
| `PUT` | `/users/:id` | ✅ | ADMIN, SUPER_ADMIN | Update user |
| `DELETE` | `/users/:id` | ✅ | ADMIN, SUPER_ADMIN | Deactivate user |
| `PATCH` | `/users/:id/activate` | ✅ | ADMIN, SUPER_ADMIN | Reactivate user |

---

### 2.3 Projects Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/projects` | ✅ | All | List projects (scoped by role) |
| `POST` | `/projects` | ✅ | ADMIN, SUPER_ADMIN, PM | Create project |
| `PUT` | `/projects/:id` | ✅ | Owner, ADMIN | Update project |
| `DELETE` | `/projects/:id` | ✅ | Owner, ADMIN | Soft delete project |
| `POST` | `/projects/:id/restore` | ✅ | ADMIN | Restore soft-deleted project |
| `GET` | `/projects/:id/members` | ✅ | Members, ADMIN | List project members |
| `POST` | `/projects/:id/members` | ✅ | Owner, ADMIN | Add member to project |
| `DELETE` | `/projects/:id/members/:userId` | ✅ | Owner, ADMIN | Remove member |
| `GET` | `/projects/:id/activities` | ✅ | Members, ADMIN | Get project activity timeline |

**Project Visibility by Role:**
- `SUPER_ADMIN / ADMIN` → all projects
- `PROJECT_MANAGER` → projects they own or are members of
- `COLLABORATOR` → projects they are members of

---

### 2.4 Tasks Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/tasks` | ✅ | List tasks (filtered by status, priority, assigneeId, projectId) |
| `POST` | `/tasks` | ✅ | Create task |
| `GET` | `/tasks/:id` | ✅ | Get task with full details |
| `PUT` | `/tasks/:id` | ✅ | Update task (fields + assignment) |
| `DELETE` | `/tasks/:id` | ✅ | Soft delete task |
| `POST` | `/tasks/:id/restore` | ✅ | Restore soft-deleted task |
| `PATCH` | `/tasks/:id/assign` | ✅ | Assign user to task |
| `PATCH` | `/tasks/:id/status` | ✅ | Update task status only |
| `PUT` | `/tasks/reorder` | ✅ | Reorder Kanban card positions |
| `GET` | `/tasks/labels` | ✅ | List all available labels |

**Task Query Parameters:**
```
GET /tasks?status=IN_PROGRESS&priority=HIGH&projectId=uuid&page=1&limit=20
```

---

### 2.5 Comments Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/tasks/:taskId/comments` | ✅ | Get all comments on a task |
| `POST` | `/tasks/:taskId/comments` | ✅ | Create a comment on a task |
| `DELETE` | `/comments/:id` | ✅ | Delete comment (author or ADMIN) |

---

### 2.6 Notifications Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications` | ✅ | Get all notifications for current user |
| `PATCH` | `/notifications/read-all` | ✅ | Mark all as read |
| `PATCH` | `/notifications/:id/read` | ✅ | Mark single as read |
| `PATCH` | `/notifications/:id/unread` | ✅ | Mark single as unread |
| `PATCH` | `/notifications/:id/star` | ✅ | Star a notification |
| `PATCH` | `/notifications/:id/unstar` | ✅ | Unstar a notification |
| `DELETE` | `/notifications/:id` | ✅ | Permanently delete notification |

**Notification Types:**
```
TASK_ASSIGNED | TASK_COMPLETED | STATUS_CHANGED |
COMMENT_ADDED | PROJECT_UPDATE | ADMIN_UPDATE |
ACCOUNT_CREATED | DEADLINE_APPROACHING
```

---

### 2.7 Settings Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/settings/notifications` | ✅ | Get notification preferences |
| `PUT` | `/settings/notifications` | ✅ | Update notification preferences |

**Preference Fields:**
```json
{
  "taskAssigned": true,
  "taskCompleted": true,
  "taskCommented": true,
  "projectUpdates": true
}
```

---

### 2.8 Attachments Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/tasks/:taskId/attachments` | ✅ | Upload file attachment (multipart/form-data) |
| `GET` | `/tasks/:taskId/attachments` | ✅ | List attachments for a task |
| `DELETE` | `/attachments/:id` | ✅ | Delete attachment |

---

### 2.9 Analytics Endpoints

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/analytics/dashboard` | ✅ | ADMIN+ | Dashboard stats overview |
| `GET` | `/analytics/tasks` | ✅ | ADMIN+ | Task distribution breakdown |
| `GET` | `/analytics/team` | ✅ | ADMIN+ | Team performance metrics |

---

### 2.10 Search Endpoint

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/search?q=keyword` | ✅ | Global search across tasks, projects, users |

---

### 2.11 Health Endpoint

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | ❌ | Service health check |

---

### Real-Time Socket.io Events

```
Connection:   ws://localhost:3000  (JWT via handshake auth)
User room:    Socket joins room = userId
```

| Event | Direction | Payload |
|---|---|---|
| `notification` | Server → Client | Notification object |
| `disconnect` | Client → Server | Auto cleanup |

---

## 3. Database Design

### PostgreSQL Schema (via Prisma)

#### Enums
```sql
ENUM Role:     SUPER_ADMIN | ADMIN | PROJECT_MANAGER | COLLABORATOR
ENUM Status:   TODO | IN_PROGRESS | COMPLETED
ENUM Priority: LOW | MEDIUM | HIGH
```

#### Tables

**User**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default uuid() |
| name | VARCHAR | NOT NULL |
| email | VARCHAR | UNIQUE, NOT NULL |
| password | VARCHAR | NOT NULL (bcrypt hashed) |
| role | Role | NOT NULL |
| isActive | BOOLEAN | DEFAULT true |
| mustResetPassword | BOOLEAN | DEFAULT true |
| resetCode | VARCHAR | NULLABLE |
| resetCodeExpiry | TIMESTAMP | NULLABLE |
| resetCodeAttempts | INT | DEFAULT 0 |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | auto-updated |

**Project**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | NOT NULL |
| description | TEXT | NOT NULL |
| ownerId | UUID | FK → User.id |
| deletedAt | TIMESTAMP | NULLABLE (soft delete) |
| createdAt | TIMESTAMP | DEFAULT now() |

**ProjectMember** *(join table)*
| Column | Type | Constraints |
|---|---|---|
| projectId | UUID | FK → Project.id, part of composite PK |
| userId | UUID | FK → User.id, part of composite PK |
| createdAt | TIMESTAMP | DEFAULT now() |

**Task**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| title | VARCHAR | NOT NULL |
| description | TEXT | NOT NULL |
| status | Status | NOT NULL |
| priority | Priority | NOT NULL |
| dueDate | TIMESTAMP | NOT NULL |
| startDate | TIMESTAMP | NULLABLE |
| estimatedHours | FLOAT | NULLABLE |
| position | INT | DEFAULT 0 (Kanban order) |
| deletedAt | TIMESTAMP | NULLABLE (soft delete) |
| completedAt | TIMESTAMP | NULLABLE |
| projectId | UUID | FK → Project.id |
| createdById | UUID | FK → User.id |
| createdAt | TIMESTAMP | DEFAULT now() |
| updatedAt | TIMESTAMP | auto-updated |

**TaskAssignment** *(join table)*
| Column | Type | Constraints |
|---|---|---|
| taskId | UUID | FK → Task.id, composite PK |
| userId | UUID | FK → User.id, composite PK |

**Comment**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| body | TEXT | NOT NULL |
| taskId | UUID | FK → Task.id |
| authorId | UUID | FK → User.id |
| createdAt | TIMESTAMP | DEFAULT now() |

**Notification**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| type | VARCHAR | NOT NULL |
| message | TEXT | NOT NULL |
| isRead | BOOLEAN | DEFAULT false |
| isStarred | BOOLEAN | DEFAULT false |
| userId | UUID | FK → User.id |
| createdAt | TIMESTAMP | DEFAULT now() |

**NotificationSettings**
| Column | Type | Constraints |
|---|---|---|
| userId | UUID | PK, FK → User.id |
| taskAssigned | BOOLEAN | DEFAULT true |
| taskCompleted | BOOLEAN | DEFAULT true |
| taskCommented | BOOLEAN | DEFAULT true |
| projectUpdates | BOOLEAN | DEFAULT true |

**Activity**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| projectId | UUID | FK → Project.id |
| userId | UUID | FK → User.id |
| action | TEXT | NOT NULL |
| createdAt | TIMESTAMP | DEFAULT now() |

**AuditLog**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| action | VARCHAR | NOT NULL |
| performedBy | UUID | FK → User.id |
| targetId | UUID | NULLABLE |
| metadata | JSON | NULLABLE |
| createdAt | TIMESTAMP | DEFAULT now() |

**Label**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR | UNIQUE |
| color | VARCHAR | DEFAULT "blue" |

**Attachment**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| fileName | VARCHAR | NOT NULL |
| bucketPath | VARCHAR | UNIQUE |
| mimeType | VARCHAR | NOT NULL |
| size | INT | NOT NULL |
| taskId | UUID | FK → Task.id |
| uploadedBy | UUID | FK → User.id |
| createdAt | TIMESTAMP | DEFAULT now() |

**RefreshToken**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User.id |
| tokenHash | VARCHAR | UNIQUE |
| expiresAt | TIMESTAMP | NOT NULL |
| revokedAt | TIMESTAMP | NULLABLE |
| ipAddress | VARCHAR | NULLABLE |
| userAgent | VARCHAR | NULLABLE |
| createdAt | TIMESTAMP | DEFAULT now() |

---

## 4. ER Diagram

```mermaid
erDiagram
    User {
        uuid id PK
        string name
        string email UK
        string password
        Role role
        boolean isActive
        boolean mustResetPassword
        string resetCode
        datetime resetCodeExpiry
        int resetCodeAttempts
        datetime createdAt
        datetime updatedAt
    }

    Project {
        uuid id PK
        string name
        string description
        uuid ownerId FK
        datetime deletedAt
        datetime createdAt
    }

    ProjectMember {
        uuid projectId PK,FK
        uuid userId PK,FK
        datetime createdAt
    }

    Task {
        uuid id PK
        string title
        string description
        Status status
        Priority priority
        datetime dueDate
        datetime startDate
        float estimatedHours
        int position
        datetime deletedAt
        datetime completedAt
        uuid projectId FK
        uuid createdById FK
        datetime createdAt
        datetime updatedAt
    }

    TaskAssignment {
        uuid taskId PK,FK
        uuid userId PK,FK
    }

    Comment {
        uuid id PK
        string body
        uuid taskId FK
        uuid authorId FK
        datetime createdAt
    }

    Notification {
        uuid id PK
        string type
        string message
        boolean isRead
        boolean isStarred
        uuid userId FK
        datetime createdAt
    }

    NotificationSettings {
        uuid userId PK,FK
        boolean taskAssigned
        boolean taskCompleted
        boolean taskCommented
        boolean projectUpdates
    }

    Activity {
        uuid id PK
        uuid projectId FK
        uuid userId FK
        string action
        datetime createdAt
    }

    AuditLog {
        uuid id PK
        string action
        uuid performedBy FK
        uuid targetId
        json metadata
        datetime createdAt
    }

    Label {
        uuid id PK
        string name UK
        string color
    }

    Attachment {
        uuid id PK
        string fileName
        string bucketPath UK
        string mimeType
        int size
        uuid taskId FK
        uuid uploadedBy FK
        datetime createdAt
    }

    RefreshToken {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        datetime expiresAt
        datetime revokedAt
        string ipAddress
        string userAgent
        datetime createdAt
    }

    User ||--o{ Project : "owns"
    User ||--o{ ProjectMember : "member of"
    Project ||--o{ ProjectMember : "has members"
    Project ||--o{ Task : "contains"
    Project ||--o{ Activity : "logs"
    User ||--o{ Task : "creates"
    User ||--o{ TaskAssignment : "assigned to"
    Task ||--o{ TaskAssignment : "has assignees"
    Task ||--o{ Comment : "has comments"
    Task ||--o{ Attachment : "has attachments"
    Task }o--o{ Label : "tagged with"
    User ||--o{ Comment : "authors"
    User ||--o{ Notification : "receives"
    User ||--|| NotificationSettings : "configures"
    User ||--o{ Activity : "performs"
    User ||--o{ AuditLog : "audited by"
    User ||--o{ RefreshToken : "holds"
    User ||--o{ Attachment : "uploads"
```

---

## 5. Class Diagrams

### 5.1 Backend Service Layer

```mermaid
classDiagram
    class NotificationService {
        +NotificationType: Object
        +PREF_KEY_MAP: Object
        +filterByPreference(userIds, type) Promise~string[]~
        +createNotification(userId, type, message) Promise~Notification~
        +createBulkNotifications(userIds, type, message) Promise~Notification[]~
        +createCustomBulkNotifications(notifArray) Promise~Notification[]~
        +getNotificationsForUser(userId, options) Promise~Object~
        +markAsRead(notificationId, userId) Promise~Notification~
        +markAllAsRead(userId) Promise~Object~
        +markAsUnread(notificationId, userId) Promise~Notification~
        +markAsStarred(notificationId, userId) Promise~Notification~
        +markAsUnstarred(notificationId, userId) Promise~Notification~
        +deleteNotification(notificationId, userId) Promise~void~
        +getAdminAndSuperAdminIds() Promise~string[]~
        -emitNotification(userId, payload) void
    }

    class CommentService {
        +createComment(taskId, authorId, body) Promise~Comment~
        +getCommentsByTask(taskId, user) Promise~Comment[]~
        +deleteComment(id, userId, userRole) Promise~void~
    }

    class ActivityService {
        +createActivity(projectId, userId, action) Promise~Activity~
    }

    class AuditService {
        +log(action, performedBy, targetId, metadata) Promise~AuditLog~
    }

    class AttachmentService {
        +uploadFile(file, taskId, uploadedBy) Promise~Attachment~
        +getAttachments(taskId) Promise~Attachment[]~
        +deleteAttachment(id, userId, role) Promise~void~
        +getSignedUrl(bucketPath) Promise~string~
    }

    class LabelSeeder {
        +seedDefaultLabels() Promise~void~
    }

    class SuperAdminSeeder {
        +seedSuperAdmin() Promise~void~
    }
```

### 5.2 Frontend Context Layer

```mermaid
classDiagram
    class AuthContext {
        +user: User
        +token: string
        +loading: boolean
        +login(email, password) Promise~void~
        +logout() void
        +setUser(user) void
    }

    class NotificationContext {
        +notifications: Notification[]
        +unreadCount: number
        +loading: boolean
        +fetchNotifications() Promise~void~
        +markAsRead(id) Promise~void~
        +markAllAsRead() Promise~void~
        +markAsUnread(id) Promise~void~
        +markAsStarred(id) Promise~void~
        +markAsUnstarred(id) Promise~void~
        +deleteNotification(id) Promise~void~
        -optimisticUpdate(id, patch) void
        -rollback(id, original) void
    }

    class ToastContext {
        +toasts: Toast[]
        +addToast(message, type) void
        +removeToast(id) void
    }

    class useSocket {
        +notifications: Notification[]
        +setNotifications(n) void
        +getSocket() Socket
        -connect(token) void
        -joinUserRoom(userId) void
        -onNotification(handler) void
    }

    class ApiService {
        +baseURL: string
        +get(url, config) Promise
        +post(url, data, config) Promise
        +put(url, data, config) Promise
        +patch(url, data, config) Promise
        +delete(url, config) Promise
        -requestInterceptor(config) config
        -responseInterceptor(res) res
        -errorInterceptor(err) Promise
    }

    NotificationContext --> ApiService : uses
    NotificationContext --> useSocket : subscribes
    AuthContext --> ApiService : uses
```

### 5.3 Role-Based Access Control

```mermaid
classDiagram
    class Role {
        <<enumeration>>
        SUPER_ADMIN
        ADMIN
        PROJECT_MANAGER
        COLLABORATOR
    }

    class Permissions {
        <<interface>>
        +canManageUsers() bool
        +canCreateProject() bool
        +canViewAllProjects() bool
        +canViewAnalytics() bool
        +canAccessAuditLogs() bool
        +canManageMembers() bool
    }

    class SuperAdminPermissions {
        +canManageUsers() true
        +canCreateProject() true
        +canViewAllProjects() true
        +canViewAnalytics() true
        +canAccessAuditLogs() true
        +canManageMembers() true
        +canTransferOwnership() true
    }

    class AdminPermissions {
        +canManageUsers() true
        +canCreateProject() true
        +canViewAllProjects() true
        +canViewAnalytics() true
        +canAccessAuditLogs() true
        +canManageMembers() true
    }

    class ProjectManagerPermissions {
        +canManageUsers() false
        +canCreateProject() true
        +canViewAllProjects() false
        +canViewAnalytics() false
        +canAccessAuditLogs() false
        +canManageMembers() true
        +projectScope: ownedOrMemberProjects
    }

    class CollaboratorPermissions {
        +canManageUsers() false
        +canCreateProject() false
        +canViewAllProjects() false
        +canViewAnalytics() false
        +canAccessAuditLogs() false
        +canManageMembers() false
        +taskScope: assignedTasksOnly
    }

    Permissions <|.. SuperAdminPermissions
    Permissions <|.. AdminPermissions
    Permissions <|.. ProjectManagerPermissions
    Permissions <|.. CollaboratorPermissions
```

---

## 6. Deployment Diagram

### 6.1 Development Environment

```mermaid
graph TB
    subgraph DEV["💻 Developer Machine"]
        subgraph DC["Docker Compose (docker-compose.yml)"]
            FE["🖥 Frontend Container\ntms_frontend_ui\nVite Dev Server :5173\nReact 18 + HMR"]
            BE["⚙️ Backend Container\ntms_backend_api\nNode.js + Express :3000\nSocket.io + Nodemon"]
            PG["🗄 Postgres Container\ntms_postgres_db\nPostgreSQL 15 :5432"]
        end
    end

    subgraph CLOUD["☁️ External Cloud Services"]
        SB_DB["🔵 Supabase\nPostgreSQL\n(prod DB)"]
        SB_ST["📦 Supabase Storage\nFile Attachments\nSigned URLs"]
    end

    Browser["🌐 Browser\nlocalhost:5173"] --> FE
    FE -->|"HTTP/REST"| BE
    FE -->|"WebSocket"| BE
    BE -->|"Prisma ORM"| PG
    BE -->|"REST API"| SB_ST

    style DEV fill:#1e293b,stroke:#475569,color:#fff
    style CLOUD fill:#0f172a,stroke:#334155,color:#fff
```

### 6.2 Production Environment

```mermaid
graph TB
    subgraph INTERNET["🌍 Internet"]
        USER["👤 End User Browser"]
    end

    subgraph HOST["🖥 Production Host / VPS"]
        subgraph DC_PROD["Docker Compose Production"]
            NGINX["🔀 Nginx Container\ntms_frontend_prod\n:80\n\n• Serves React SPA static files\n• Reverse proxy /api/* → backend\n• Reverse proxy /socket.io/* → backend\n• Gzip compression\n• Security headers\n• Static asset caching"]

            BE_PROD["⚙️ Backend Container\ntms_backend_prod\nNode.js :3000\n\n• Express REST API\n• Socket.io WebSocket\n• JWT auth\n• Prisma ORM\n• Rate limiting\n• Helmet security"]

            PG_PROD["🗄 Postgres Container\ntms_postgres_prod\n:5432\n\n• PostgreSQL 15 Alpine\n• Persistent volume\n• Health checked"]
        end
    end

    subgraph CLOUD_PROD["☁️ External Cloud Services"]
        SB_AUTH["🔵 Supabase\nPostgreSQL\n(optional hosted DB)"]
        SB_FILES["📦 Supabase Storage\nFile Attachments\nS3-compatible API"]
        SMTP["📧 SMTP Provider\nPassword Reset Emails"]
    end

    USER -->|"HTTPS :443 / HTTP :80"| NGINX
    NGINX -->|"Static files"| NGINX
    NGINX -->|"Proxy /api/*"| BE_PROD
    NGINX -->|"Proxy /socket.io/*\nWebSocket Upgrade"| BE_PROD
    BE_PROD -->|"Prisma"| PG_PROD
    BE_PROD -->|"File Upload API"| SB_FILES
    BE_PROD -->|"SMTP"| SMTP

    style INTERNET fill:#1e293b,stroke:#475569,color:#fff
    style HOST fill:#0f172a,stroke:#334155,color:#fff
    style CLOUD_PROD fill:#172554,stroke:#1e40af,color:#fff
```

### 6.3 Request Flow Diagram

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Nginx
    participant API as Express API
    participant DB as PostgreSQL
    participant S3 as Supabase Storage
    participant WS as Socket.io

    B->>N: GET / (SPA)
    N-->>B: index.html + JS bundles

    B->>N: POST /api/v1/auth/login
    N->>API: proxy request
    API->>DB: find user, verify password
    DB-->>API: user row
    API-->>N: {token, user}
    N-->>B: JWT access token

    B->>WS: Connect (auth: token)
    WS->>API: verify JWT
    API-->>WS: join room = userId

    B->>N: POST /api/v1/tasks (Bearer token)
    N->>API: proxy + auth middleware
    API->>DB: create task + assignments
    DB-->>API: task object
    API->>WS: emit notification to assignees
    WS-->>B: real-time notification push
    API-->>N: 201 task object
    N-->>B: response

    B->>N: POST /api/v1/tasks/:id/attachments
    N->>API: proxy multipart upload
    API->>S3: upload file to Supabase bucket
    S3-->>API: bucketPath
    API->>DB: save Attachment record
    DB-->>API: attachment object
    API-->>B: {attachment, signedUrl}
```

### 6.4 Notification Preference Flow

```mermaid
flowchart TD
    E["🎯 Event Occurs\ne.g. Task Created"] --> T{"Determine\nNotification Type"}
    T --> |"TASK_ASSIGNED"| P1["Check preferences:\ntaskAssigned field"]
    T --> |"TASK_COMPLETED / STATUS_CHANGED"| P2["Check preferences:\ntaskCompleted field"]
    T --> |"COMMENT_ADDED"| P3["Check preferences:\ntaskCommented field"]
    T --> |"PROJECT_UPDATE"| P4["Check preferences:\nprojectUpdates field"]
    T --> |"ADMIN_UPDATE / ACCOUNT_CREATED"| SEND["✅ Always Send\n(no opt-out)"]

    P1 --> F["filterByPreference(userIds, type)"]
    P2 --> F
    P3 --> F
    P4 --> F

    F --> DB["Query NotificationSettings\nfor each recipient"]
    DB --> FILTER["Filter out users\nwho opted out"]
    FILTER --> CREATE["createManyAndReturn\nin PostgreSQL"]
    CREATE --> EMIT["Socket.io emit\nto each recipient's room"]
    EMIT --> UI["🔔 Real-time badge update\nin browser"]
```

---

## Appendix: Environment Variables

### Backend `.env`
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10
JWT_SECRET=<256-bit-random-secret>
PORT=3000
FRONTEND_URL=http://localhost:5173
CLIENT_ORIGIN=http://localhost,http://localhost:80
NODE_ENV=development
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_BUCKET=Attachment
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

---

*Documentation generated: June 26, 2026 | WorkNest v1.0*
