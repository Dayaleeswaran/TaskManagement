# Database Implementation Guide: Migrations, Seeds & Relations

This guide provides the complete setup, execution plan, seeding strategy, verification queries, and troubleshooting guide for the Task Management System's database layer using Prisma ORM inside a Docker environment.

---

## 1. Complete Prisma Schema (`backend/prisma/schema.prisma`)

Below is the complete `schema.prisma` file incorporating UUID defaults, relations with explicit `@relation` decorators, cascade delete rules, and custom database indexes to optimize query performance.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// ENUMS
// ==========================================

enum Role {
  ADMIN
  PROJECT_MANAGER
  COLLABORATOR
}

enum Status {
  TODO
  IN_PROGRESS
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

// ==========================================
// MODELS
// ==========================================

model User {
  id                String           @id @default(uuid())
  name              String
  email             String           @unique
  password          String
  role              Role
  isActive          Boolean          @default(true)
  mustResetPassword Boolean          @default(true)
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  ownedProjects     Project[]        @relation("ProjectOwner")
  createdTasks      Task[]           @relation("TaskCreator")
  assignments       TaskAssignment[]
  comments          Comment[]        @relation("CommentAuthor")
  notifications     Notification[]
}

model Project {
  id          String   @id @default(uuid())
  name        String
  description String
  createdAt   DateTime @default(now())

  ownerId     String
  owner       User     @relation("ProjectOwner", fields: [ownerId], references: [id], onDelete: Cascade)

  tasks       Task[]

  @@index([ownerId])
}

model Task {
  id          String           @id @default(uuid())
  title       String
  description String
  status      Status
  priority    Priority
  dueDate     DateTime
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  projectId   String
  project     Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)

  createdById String
  createdBy   User             @relation("TaskCreator", fields: [createdById], references: [id], onDelete: Cascade)

  assignments TaskAssignment[]
  comments    Comment[]

  @@index([projectId])
  @@index([createdById])
  @@index([status])
  @@index([priority])
}

model TaskAssignment {
  taskId String
  userId String

  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([taskId, userId])
  @@index([userId])
}

model Comment {
  id        String   @id @default(uuid())
  body      String
  createdAt DateTime @default(now())

  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  authorId  String
  author    User     @relation("CommentAuthor", fields: [authorId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([authorId])
}

model Notification {
  id        String   @id @default(uuid())
  type      String
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

---

## 2. Migration Execution Plan (Docker)

To run the migrations and sync the schema inside the running backend container, follow these steps:

### Step 1: Ensure Containers are Running
Verify that your containers (`tms_backend_api` and `tms_postgres_db`) are up and running:
```bash
docker ps
```
If they are not running, spin them up:
```bash
docker compose up -d
```

### Step 2: Option A: Exec into the Container and Run commands
To open an interactive shell inside the backend container:
```bash
docker compose exec backend sh
```
Then run the migration command inside the shell:
```bash
npx prisma migrate dev --name init
```

### Step 3: Option B: Run Directly from the Host (Recommended)
You can execute commands inside the container directly from your host terminal:
```bash
# Run migration
docker compose exec backend npx prisma migrate dev --name init

# Run seed
docker compose exec backend npx prisma db seed
```

---

## 3. Database Seed File (`backend/prisma/seed.js`)

Below is the complete CommonJS-compatible seed script that populates the PostgreSQL database:

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database records...');
  // Clear existing records in reverse order of relations
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Generating password hashes...');
  // Hash passwords using bcrypt
  const adminPasswordHash = await bcrypt.hash('Admin@123!', 12);
  const pmPasswordHash = await bcrypt.hash('Manager@123!', 12);
  const collabPasswordHash = await bcrypt.hash('Collab@123!', 12);

  console.log('Seeding users...');
  // 1. Create Admin account
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@tms.com',
      password: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
      mustResetPassword: true,
    },
  });

  // 2. Create 2 Project Manager accounts
  const pm1 = await prisma.user.create({
    data: {
      name: 'Project Manager One',
      email: 'pm1@tms.com',
      password: pmPasswordHash,
      role: 'PROJECT_MANAGER',
      isActive: true,
      mustResetPassword: true,
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      name: 'Project Manager Two',
      email: 'pm2@tms.com',
      password: pmPasswordHash,
      role: 'PROJECT_MANAGER',
      isActive: true,
      mustResetPassword: true,
    },
  });

  // 3. Create 3 Collaborator accounts
  const collab1 = await prisma.user.create({
    data: {
      name: 'Collaborator One',
      email: 'collab1@tms.com',
      password: collabPasswordHash,
      role: 'COLLABORATOR',
      isActive: true,
      mustResetPassword: true,
    },
  });

  const collab2 = await prisma.user.create({
    data: {
      name: 'Collaborator Two',
      email: 'collab2@tms.com',
      password: collabPasswordHash,
      role: 'COLLABORATOR',
      isActive: true,
      mustResetPassword: true,
    },
  });

  const collab3 = await prisma.user.create({
    data: {
      name: 'Collaborator Three',
      email: 'collab3@tms.com',
      password: collabPasswordHash,
      role: 'COLLABORATOR',
      isActive: true,
      mustResetPassword: true,
    },
  });

  console.log('Seeding projects...');
  // 4. Create 1 Sample Project
  const project = await prisma.project.create({
    data: {
      name: 'Acme Website Redesign',
      description: 'A comprehensive project to redesign the corporate website with modern architecture.',
      ownerId: pm1.id,
    },
  });

  console.log('Seeding tasks...');
  // 5. Create 3 Sample Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Setup Database and Run Migrations',
      description: 'Configure Prisma ORM and execute initial migrations inside Docker.',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      projectId: project.id,
      createdById: admin.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Implement User Authentication',
      description: 'Implement JWT login, registration, and role-based access control.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      projectId: project.id,
      createdById: pm1.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Write Comprehensive Unit Tests',
      description: 'Write Jest unit tests for auth endpoints and prisma models.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      projectId: project.id,
      createdById: pm2.id,
    },
  });

  console.log('Seeding assignments...');
  // 6. Create assignments (taskId -> Task, userId -> User)
  // Task 1 assigned to collab1
  await prisma.taskAssignment.create({
    data: {
      taskId: task1.id,
      userId: collab1.id,
    },
  });

  // Task 2 assigned to collab1 and collab2
  await prisma.taskAssignment.create({
    data: {
      taskId: task2.id,
      userId: collab1.id,
    },
  });
  await prisma.taskAssignment.create({
    data: {
      taskId: task2.id,
      userId: collab2.id,
    },
  });

  // Task 3 assigned to collab3
  await prisma.taskAssignment.create({
    data: {
      taskId: task3.id,
      userId: collab3.id,
    },
  });

  console.log('Seeding comments and notifications...');
  // 7. Seed sample Comment
  await prisma.comment.create({
    data: {
      body: 'Database setup completed successfully. Seed scripts are ready.',
      taskId: task1.id,
      authorId: collab1.id,
    },
  });

  // 8. Seed sample Notification
  await prisma.notification.create({
    data: {
      type: 'TASK_ASSIGNMENT',
      message: `You have been assigned to task: "${task2.title}"`,
      isRead: false,
      userId: collab2.id,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 4. `package.json` Prisma Seed Config Block

The seed config is defined inside `backend/package.json` to instruct Prisma to use node to execute the seed file:

```json
  "prisma": {
    "seed": "node prisma/seed.js"
  }
```

---

## 5. Data Integrity Verification Queries (Raw SQL)

Run these SQL queries inside the PostgreSQL container to verify relationships, counts, and integrity. 

You can run these via terminal using the command format:
`docker compose exec postgres psql -U postgres -d tms_dev_db -c "<QUERY_TEXT>"`

### Query 1: Count Users by Role
Verifies that all 6 users were created and correctly classified.
```sql
SELECT role, COUNT(*) FROM "User" GROUP BY role;
```

### Query 2: Projects and Owner Relation (One-to-Many)
Confirms that the project is linked to the correct Owner User (Project Manager).
```sql
SELECT p.name AS project_name, u.name AS owner_name 
FROM "Project" p 
JOIN "User" u ON p."ownerId" = u.id;
```

### Query 3: Tasks and Creators (One-to-Many)
Confirms that tasks are registered under their creators.
```sql
SELECT t.title AS task_title, u.name AS creator_name 
FROM "Task" t 
JOIN "User" u ON t."createdById" = u.id;
```

### Query 4: Task Assignments (Many-to-Many Join Relation)
Confirms many-to-many linkages between users and tasks.
```sql
SELECT t.title AS task_title, u.name AS assigned_user 
FROM "TaskAssignment" ta 
JOIN "Task" t ON ta."taskId" = t.id 
JOIN "User" u ON ta."userId" = u.id;
```

### Query 5: Comments and Authors
Confirms that comments are linked correctly to tasks and users.
```sql
SELECT c.body AS comment_body, u.name AS author_name, t.title AS task_title 
FROM "Comment" c 
JOIN "User" u ON c."authorId" = u.id 
JOIN "Task" t ON c."taskId" = t.id;
```

### Query 6: Notifications and Receivers
Confirms system notifications are delivered and stored for the correct target user.
```sql
SELECT n.message, u.name AS user_name, n."isRead" 
FROM "Notification" n 
JOIN "User" u ON n."userId" = u.id;
```

---

## 6. Common Migration Error Fixes

### Error A: "Connection refused" / `P1001: Can't reach database server`
*   **Cause**: PostgreSQL is not yet running or listening on the port, or host network mapping is wrong.
*   **Resolution**: 
    1. Check if the database container is running: `docker ps`.
    2. Check the docker-compose network. Inside Docker, the backend connects using host `postgres:5432` (defined as `postgres` service). Outside Docker, tools connect via `localhost:5432`.
    3. Ensure the port forward `- "5432:5432"` is specified in your `docker-compose.yml` under the `postgres` service.
    4. Wait 5-10 seconds for PostgreSQL daemon to finish booting before running migrations.

### Error B: "Schema Drift" / `Migration database and schema are out of sync`
*   **Cause**: Changes were made manually to the database or schema without generating a migration, or a migration file was deleted/altered.
*   **Resolution**:
    *   To reset the database environment completely and rerun all migrations:
        ```bash
        docker compose exec backend npx prisma migrate reset
        ```
    *   *Warning*: This will delete all tables and data. Prisma will automatically run the seed script after reset.

### Error C: "Shadow Database Issues" (e.g., when trying to run migrate dev on cloud databases)
*   **Cause**: Prisma attempts to create a temporary shadow database to perform schema diffs, but the database user lacks permission to create new databases.
*   **Resolution**:
    *   Since we are using Docker local environment with a superuser (`postgres`), this does not occur.
    *   If you migrate this to a cloud environment (e.g. Supabase, Neon) where shadow db is not supported, add `shadowDatabaseUrl` in `schema.prisma` datasource, or run:
        ```bash
        npx prisma db push
        ```
        instead of `migrate dev` to apply schemas directly without generating migration history files.
