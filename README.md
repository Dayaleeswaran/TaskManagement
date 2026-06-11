# Task Management System

A multi-containerized task management application designed for seamless team collaboration.

## Team Roles & Responsibilities

- **Member 1 (Lead)** - Repository Architecture & Branch Strategy Setup
- **Member 2 (Database Designer)** - DB Schema Modeling & Visual Layout Blueprint (ERD)
- **Member 3 (Frontend Developer)** - React + Vite + Tailwind CSS Client Initialization & Page Scaffolding
- **Member 4 (Backend Developer)** - Express Server Initialization, Prisma ORM Configuration, & Folder Tree Architecture
- **Member 5 (DevOps/SRE)** - Container Orchestration, Dockerfile Configuration, & Compose Deployment Environment

---

## Sequential Execution Rules

To ensure a conflict-free and structured codebase integration, the project followed this strict order of execution:

1. **Step 1 (Lead):** Initialize the project repository, branch ecosystem (`dev` branch), root `.gitignore`, and the baseline documentation.
2. **Step 2 (Database Designer):** Model the database schema (User, Task, Comment, Notification entities) and export the visualization blueprint as `docs/erd.png`.
3. **Step 3 (Backend Developer):** Bootstrap the Node.js + Express backend framework, configure folders (`routes`, `controllers`, `services`, `middleware`), integrate Prisma ORM models, and setup local environment controls.
4. **Step 4 (Frontend Developer):** Scaffold the React client using Vite, configure Tailwind CSS utilities, clean boilerplate artifacts, and establish layout folders and view routes.
5. **Step 5 (DevOps/SRE):** Draft individual service Dockerfiles and assemble the master `docker-compose.yml` to orchestrate Postgres, Backend API, and Frontend UI containers.

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) (with Docker Compose) installed on your system.

### Running the Application

To run the entire system in a multi-container Docker environment, navigate to the root directory and execute:

```bash
docker-compose up --build
```

- **PostgreSQL Database:** Running on port `5432`
- **Express Backend API:** Running on port `3000`
- **Vite React UI:** Running on port `5173`

---

## DevOps & CI/CD Strategy

For detailed instructions and strategies regarding the system's CI/CD pipeline, branching strategies, security scanning, container validation, and environment variables, refer to the [DevOps & CI/CD Strategy Documentation](file:///c:/Users/amadi/TaskManagement/docs/devops-ci-cd-strategy.md).

### Continuous Integration (CI) Actions
A GitHub Actions workflow is defined in [.github/workflows/ci.yml](file:///c:/Users/amadi/TaskManagement/.github/workflows/ci.yml) which performs:
- **Build Checks**: Installs dependencies and compiles both the backend and frontend.
- **Docker Validation**: Lints Dockerfiles via Hadolint.
- **Security Scanning**: Audits dependencies for vulnerability warnings and runs Trivy on container images.
- **Prisma Schema Verification**: Validates formatting and database integrity mapping.
