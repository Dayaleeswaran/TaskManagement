# 🪺 WorkNest — Enterprise Task Management System

WorkNest is a premium, containerized, real-time Task Management System designed for modern enterprise teams. It features a robust multi-tenant role-based access control (RBAC) architecture, real-time collaboration via WebSockets, an interactive Kanban interface with drag-and-drop mechanics, enterprise-grade audit logging, attachment storage, and automated CI/CD validation.

---

## 🚀 Key Features

### 👤 Role-Based Access Control (RBAC)
WorkNest enforces strict access boundaries across four distinct user roles:
*   **SUPER_ADMIN:** Holds system-wide authority. Manages user provisioning, role assignments, and tracks system audits via the **Audit Logs** dashboard.
*   **ADMIN:** Configures enterprise settings, manages projects, provisions tasks, and monitors team KPIs.
*   **PROJECT_MANAGER:** Drafts project workspaces, plans tasks, assigns collaborators, and updates task definitions.
*   **COLLABORATOR:** Interacts with assigned tasks. Views personal boards, shifts task status, uploads attachments, and communicates via comments.

### 📋 Interactive Kanban Board & Task Controls
*   **Drag-and-Drop Kanban:** Fluid task movement between columns (`TODO`, `IN_PROGRESS`, `COMPLETED`) powered by `@dnd-kit`.
*   **Granular Fields:** Support for task titles, rich descriptions, priority levels (`LOW`, `MEDIUM`, `HIGH`), estimated hours, start dates, and due dates.
*   **Task Labeling:** Dynamic tags (`Label` model) for advanced indexing.
*   **File Attachments:** Secure, multi-format attachments saved directly to Supabase storage buckets.

### ⚡ Real-Time Synchronization & Communication
*   **WebSocket Engine:** Powered by `Socket.io` to sync comments, updates, and assignments across client sessions instantaneously.
*   **Live Notification Center:** Interactive alerts and custom UI banners for system updates and task assignments.

### 🛡️ Enterprise Security & Auditing
*   **Comprehensive Audit Logs:** Automated logging of critical operations, state mutations, and user logins.
*   **Database Level Security:** Prisma ORM constraints mapping out relations and handling soft deletes for `Project` and `Task` entities.
*   **Secure Auth Flow:** Token-based JWT authentication paired with secure cookie handling, password reset mechanisms, and rate limiters.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS 4 | Ultra-fast rendering, sleek custom-designed components, responsive utility-first styles |
| **State & Navigation** | React Router Dom 7, Context API | Declarative routing, centralized authentication and notification contexts |
| **Interactive UI** | Lucide React, @dnd-kit | Rich icon system and smooth drag-and-drop workspace layout |
| **Backend API** | Node.js, Express 5, Zod | High-performance server, declarative schema validations, rate limiting, and security headers |
| **Database & ORM** | PostgreSQL, Prisma Client | Relational schema modeling with migration history |
| **Real-time Engine** | Socket.io | Bi-directional websocket connection for instant collaboration |
| **Storage Integration**| Supabase Storage SDK | Cloud-based container bucket storage for project files |
| **DevOps / CI-CD** | Docker, Nginx, GitHub Actions | HADOLINT, Trivy container security scans, automatic CI pipeline |

---

## 📁 Repository Directory Structure

```text
TaskManagement/
├── .github/workflows/          # CI/CD workflows (GitHub Actions)
├── backend/                    # Express backend architecture
│   ├── prisma/                 # Database schema definitions & migrations
│   │   └── schema.prisma       # Master Prisma schema
│   ├── src/                    # API controllers, models, and routes
│   │   ├── controllers/        # Core business logic handlers
│   │   ├── middleware/         # Auth, RBAC, and error validation middleware
│   │   ├── routes/             # REST endpoints (auth, task, analytics, etc.)
│   │   ├── services/           # Socket and external SDK wrappers
│   │   └── app.js              # Server entrypoint
│   ├── Dockerfile              # Development environment container spec
│   └── Dockerfile.prod         # Production multi-stage build spec
├── frontend/                   # React frontend codebase
│   ├── public/                 # Static assets & routing configurations
│   ├── src/                    # React application source code
│   │   ├── components/         # Reusable layouts, buttons, cards, and portals
│   │   ├── context/            # Auth, toast notification, and global state
│   │   ├── hooks/              # Custom React hooks (sockets, media queries)
│   │   ├── pages/              # View pages (Dashboard, Projects, Audit Logs)
│   │   └── App.jsx             # React routing entrypoint
│   ├── Dockerfile              # Dev server container configuration
│   └── nginx.conf              # Reverse proxy server configuration for client routing
├── docs/                       # Specifications, deployment guides, and DB models
├── docker-compose.yml          # Container configuration for local development
└── docker-compose.prod.yml     # Container configuration for production stack
```

---

## ⚙️ Getting Started

### Prerequisites
Make sure you have the following installed on your host machine:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
*   [Node.js](https://nodejs.org/) (v20+ recommended for local backend/frontend scripting)

### Quick Start (Docker Environment)

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/TaskManagement.git
    cd TaskManagement
    ```

2.  **Configure Environment Variables:**
    *   Create a `.env` file in the `backend/` directory by copying `backend/.env.example`.
    *   Create a `.env` file in the `frontend/` directory by copying `frontend/.env.example`.
    *   *Note: Ensure Postgres credentials match the config inside `docker-compose.yml`.*

3.  **Spin Up Containers:**
    Run the dev compose bundle from the root directory:
    ```bash
    docker-compose up --build
    ```

    This command spins up the following services:
    *   **Postgres DB:** Running on port `5432`
    *   **Express Backend Server:** Available at `http://localhost:3000`
    *   **React Frontend (Vite):** Accessible at `http://localhost:5173`

4.  **Seed the Database:**
    To seed the database with admin roles, PMs, and mock tasks, execute inside the backend container:
    ```bash
    docker-compose exec backend npx prisma db seed
    ```

---

## 📘 API Documentation (Swagger)

The backend server features interactive documentation via Swagger UI.

*   **Interactive UI Portal:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
*   **JSON Schema Blueprint:** [http://localhost:3000/api/docs/swagger.json](http://localhost:3000/api/docs/swagger.json)

### Accessing Authenticated Endpoints in Swagger:
1. Send a login payload to the `POST /api/v1/auth/login` endpoint to acquire an access token.
2. Click the green **Authorize** button in the Swagger UI.
3. Paste the token directly into the input field. (The Swagger UI automatically appends the `Bearer` prefix).

---

## 🚦 Continuous Integration (CI) Checks

WorkNest utilizes a strict workflow defined in `.github/workflows/ci.yml` that triggers on pull requests and commits to core branches:
*   **Hadolint:** Validates and optimizes both frontend and backend Dockerfiles.
*   **Trivy:** Scans built docker images for dependency and configuration vulnerabilities.
*   **Prisma Validation:** Verifies structural schema consistency before generating the database client.
*   **Build Integrity:** Installs local package manifests and compiles packages to guarantee no regressions exist in static code.

---

## 🌐 Deployment Instructions

Detailed step-by-step guides for various hosting environments can be found in the `docs/` folder:
*   [Vercel Frontend Guide](./docs/vercel-deployment-guide.md)
*   [Render Backend & Database Guide](./docs/render-deployment-guide.md)
*   [Azure Deployment Guide](./docs/azure-deployment-guide.md)
