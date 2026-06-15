const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database records...');
  // Clear existing records in reverse order of relations to prevent foreign key constraint violations
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Generating password hashes...');
  const adminPasswordHash = await bcrypt.hash('Admin@123!', 12);
  const pmPasswordHash = await bcrypt.hash('Manager@123!', 12);
  const collabPasswordHash = await bcrypt.hash('Collab@123!', 12);

  console.log('Seeding users...');
  // Create 1 Admin
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

  // Create 2 Project Managers
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

  // Create 3 Collaborators
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

  console.log('Seeding 5 projects across 2 PMs...');
  // Project Manager 1 Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Acme Website Redesign',
      description: 'A comprehensive project to redesign the corporate website with modern architecture.',
      ownerId: pm1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App MVP',
      description: 'Design and build the initial MVP for the iOS and Android mobile applications.',
      ownerId: pm1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Cloud Migration Phase 1',
      description: 'Migrating legacy infrastructure and file storage systems to AWS.',
      ownerId: pm1.id,
    },
  });

  // Project Manager 2 Projects
  const project4 = await prisma.project.create({
    data: {
      name: 'Security Audit 2026',
      description: 'Internal and external vulnerability scanning and patch implementation compliance.',
      ownerId: pm2.id,
    },
  });

  const project5 = await prisma.project.create({
    data: {
      name: 'API Integration Hub',
      description: 'Centralized microservice integration connecting CRM, ERP, and payment systems.',
      ownerId: pm2.id,
    },
  });

  console.log('Seeding 15 tasks across projects with varied status and priority...');
  // Project 1 Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Setup Database and Run Migrations',
      description: 'Configure Prisma ORM and execute initial migrations inside Docker.',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      createdById: admin.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Implement User Authentication',
      description: 'Implement JWT login, registration, and role-based access control.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      createdById: pm1.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Write Comprehensive Unit Tests',
      description: 'Write Jest unit tests for auth endpoints and prisma models.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      projectId: project1.id,
      createdById: pm2.id,
    },
  });

  // Project 2 Tasks
  const task4 = await prisma.task.create({
    data: {
      title: 'Design Mobile App UI Wireframes',
      description: 'Create Figma design wireframes for key user dashboards and profiles.',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      projectId: project2.id,
      createdById: pm1.id,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'Setup Push Notification Service',
      description: 'Configure Firebase Cloud Messaging credentials and registration endpoints.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      projectId: project2.id,
      createdById: pm1.id,
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: 'Build Authentication Screens',
      description: 'Construct native mobile UI for signup, signin, and password recovery.',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      projectId: project2.id,
      createdById: pm1.id,
    },
  });

  // Project 3 Tasks
  const task7 = await prisma.task.create({
    data: {
      title: 'Analyze Cloud Cost Metrics',
      description: 'Review cost allocation reports and highlight idle resources.',
      status: 'COMPLETED',
      priority: 'LOW',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      projectId: project3.id,
      createdById: pm1.id,
    },
  });

  const task8 = await prisma.task.create({
    data: {
      title: 'Migrate S3 Buckets to New Region',
      description: 'Copy legacy media uploads folder to the optimized central storage bucket.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      projectId: project3.id,
      createdById: pm1.id,
    },
  });

  const task9 = await prisma.task.create({
    data: {
      title: 'Configure Terraform State Locker',
      description: 'Use DynamoDB backend to lock TF states and prevent execution race conditions.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      projectId: project3.id,
      createdById: pm1.id,
    },
  });

  // Project 4 Tasks
  const task10 = await prisma.task.create({
    data: {
      title: 'Review Code Vulnerability Report',
      description: 'Inspect dependencies and code quality report produced by SonarQube.',
      status: 'COMPLETED',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      projectId: project4.id,
      createdById: pm2.id,
    },
  });

  const task11 = await prisma.task.create({
    data: {
      title: 'Implement Rate Limiting Middleware',
      description: 'Configure standard Express-Rate-Limit parameters on authentication endpoints.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      projectId: project4.id,
      createdById: pm2.id,
    },
  });

  const task12 = await prisma.task.create({
    data: {
      title: 'Penetration Testing',
      description: 'Execute automated security scanning scripts against local staging environment.',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      projectId: project4.id,
      createdById: pm2.id,
    },
  });

  // Project 5 Tasks
  const task13 = await prisma.task.create({
    data: {
      title: 'Setup API Gateway Routing',
      description: 'Configure proxies and endpoint forwarding on the main integration hub.',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      projectId: project5.id,
      createdById: pm2.id,
    },
  });

  const task14 = await prisma.task.create({
    data: {
      title: 'Integrate Stripe Payment Gateway',
      description: 'Create checkout session endpoints and verify payments using Stripe webhooks.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      projectId: project5.id,
      createdById: pm2.id,
    },
  });

  const task15 = await prisma.task.create({
    data: {
      title: 'Document API Endpoints using Swagger',
      description: 'Write complete OpenAPI YAML/JSdoc descriptions for endpoints and payloads.',
      status: 'TODO',
      priority: 'LOW',
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      projectId: project5.id,
      createdById: pm2.id,
    },
  });

  console.log('Seeding task assignments...');
  const assignments = [
    { taskId: task1.id, userId: collab1.id },
    { taskId: task2.id, userId: collab1.id },
    { taskId: task2.id, userId: collab2.id },
    { taskId: task3.id, userId: collab3.id },
    { taskId: task4.id, userId: collab2.id },
    { taskId: task5.id, userId: collab1.id },
    { taskId: task6.id, userId: collab2.id },
    { taskId: task6.id, userId: collab3.id },
    { taskId: task7.id, userId: collab1.id },
    { taskId: task8.id, userId: collab2.id },
    { taskId: task9.id, userId: collab3.id },
    { taskId: task10.id, userId: collab1.id },
    { taskId: task10.id, userId: collab3.id },
    { taskId: task11.id, userId: collab2.id },
    { taskId: task12.id, userId: collab3.id },
    { taskId: task13.id, userId: collab1.id },
    { taskId: task14.id, userId: collab2.id },
    { taskId: task14.id, userId: collab3.id },
    { taskId: task15.id, userId: collab1.id }
  ];

  for (const assignment of assignments) {
    await prisma.taskAssignment.create({
      data: assignment
    });
  }

  console.log('Seeding 10 comments across tasks...');
  const comments = [
    { body: 'Database setup completed successfully. Seed scripts are ready.', taskId: task1.id, authorId: collab1.id },
    { body: 'Auth middleware code has been written, starting JWT integration.', taskId: task2.id, authorId: collab1.id },
    { body: 'JWT integration is done, now adding refresh tokens.', taskId: task2.id, authorId: collab2.id },
    { body: 'I will start writing Jest tests for the auth endpoints.', taskId: task3.id, authorId: collab3.id },
    { body: 'Wireframe designs approved by the product team.', taskId: task4.id, authorId: collab2.id },
    { body: 'Configured FCM credentials in backend .env.', taskId: task5.id, authorId: collab1.id },
    { body: 'Terraform locking configured with DynamoDB.', taskId: task9.id, authorId: collab3.id },
    { body: 'Completed the first round of manual pen-testing on auth endpoints.', taskId: task12.id, authorId: collab3.id },
    { body: 'API gateway routes are working on localhost.', taskId: task13.id, authorId: collab1.id },
    { body: 'Stripe webhook handling requires testing with SSL certificates.', taskId: task14.id, authorId: collab2.id }
  ];

  for (const comment of comments) {
    await prisma.comment.create({
      data: comment
    });
  }

  console.log('Seeding 8 notifications (unread/read)...');
  const notifications = [
    { type: 'TASK_ASSIGNMENT', message: `You have been assigned to task: "${task2.title}"`, isRead: false, userId: collab2.id },
    { type: 'TASK_ASSIGNMENT', message: `You have been assigned to task: "${task6.title}"`, isRead: true, userId: collab3.id },
    { type: 'COMMENT_ADDED', message: `New comment on Task "${task2.title}" by ${collab2.name}`, isRead: false, userId: pm1.id },
    { type: 'PROJECT_CREATED', message: `Security Audit project has been initialized`, isRead: true, userId: admin.id },
    { type: 'TASK_ASSIGNMENT', message: `You have been assigned to task: "${task10.title}"`, isRead: false, userId: collab1.id },
    { type: 'TASK_ASSIGNMENT', message: `You have been assigned to task: "${task14.title}"`, isRead: false, userId: collab3.id },
    { type: 'PROJECT_CREATED', message: `New project created: Cloud Migration Phase 1`, isRead: true, userId: pm1.id },
    { type: 'SYSTEM_EVENT', message: `Database migration completed successfully`, isRead: false, userId: admin.id }
  ];

  for (const notification of notifications) {
    await prisma.notification.create({
      data: notification
    });
  }

  console.log('Database expanded seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
