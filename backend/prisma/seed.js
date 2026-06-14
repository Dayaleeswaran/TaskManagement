const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database records...');
  // Clear existing data in reverse order of relations to prevent foreign key constraint violations
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Generating password hashes...');
  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123!', 12);
  const pmPasswordHash = await bcrypt.hash('Manager@123!', 12);
  const collabPasswordHash = await bcrypt.hash('Collab@123!', 12);

  console.log('Seeding users...');
  // 1. Create Admin
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

  // 2. Create 2 Project Managers
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

  // 3. Create 3 Collaborators
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
      ownerId: pm1.id, // Project Manager One is the owner
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
      type: 'TASK_ASSIGNED',
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
