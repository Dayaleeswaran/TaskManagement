import { PrismaClient, Role, ProjectRole, TaskStatus, Priority, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clear existing records in reverse order of relations
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // Create initial users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@tms.com',
      passwordHash,
      role: Role.ADMIN,
      requiresPasswordReset: true,
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Project Manager',
      email: 'manager@tms.com',
      passwordHash,
      role: Role.PROJECT_MANAGER,
      requiresPasswordReset: true,
      isActive: true,
    },
  });

  const collaborator = await prisma.user.create({
    data: {
      name: 'Collaborator',
      email: 'collaborator@tms.com',
      passwordHash,
      role: Role.COLLABORATOR,
      requiresPasswordReset: true,
      isActive: true,
    },
  });

  // Create initial project
  const project = await prisma.project.create({
    data: {
      title: 'Task Management Suite',
      description: 'Initial project setup for developing the new task manager platform.',
      createdById: admin.id,
    },
  });

  // Create project memberships
  await prisma.projectMember.createMany({
    data: [
      {
        projectId: project.id,
        userId: admin.id,
        role: ProjectRole.OWNER,
      },
      {
        projectId: project.id,
        userId: manager.id,
        role: ProjectRole.MANAGER,
      },
      {
        projectId: project.id,
        userId: collaborator.id,
        role: ProjectRole.MEMBER,
      },
    ],
  });

  // Create initial tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Design Database Schema',
      description: 'Review the ERD and write the Prisma schema matching the database dictionary.',
      status: TaskStatus.COMPLETED,
      priority: Priority.HIGH,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      projectId: project.id,
      assignedToId: manager.id,
      createdByUserId: admin.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Implement Authentication',
      description: 'Create login, JWT authentication, and password reset endpoints.',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      projectId: project.id,
      assignedToId: collaborator.id,
      createdByUserId: manager.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Write API Documentation',
      description: 'Document all REST endpoints using Swagger OpenAPI specification.',
      status: TaskStatus.PENDING,
      priority: Priority.MEDIUM,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      projectId: project.id,
      assignedToId: collaborator.id,
      createdByUserId: manager.id,
    },
  });

  // Create initial comments
  await prisma.comment.createMany({
    data: [
      {
        body: 'The initial schema looks solid. Let\'s move to the migration phase.',
        taskId: task1.id,
        userId: admin.id,
      },
      {
        body: 'Agreed, we will proceed with the Prisma migration and seed generation.',
        taskId: task1.id,
        userId: manager.id,
      },
    ],
  });

  // Create initial notification
  await prisma.notification.create({
    data: {
      type: NotificationType.TASK,
      message: `You have been assigned to task "${task2.title}"`,
      isRead: false,
      userId: collaborator.id,
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });