const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data from database...');
  
  // Delete records in order of dependency
  await prisma.notificationSettings.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.label.deleteMany({});

  // Delete all users except SUPER_ADMIN
  await prisma.user.deleteMany({
    where: {
      role: { not: 'SUPER_ADMIN' }
    }
  });

  console.log('Ensuring Super Admin exists with password Password123!...');
  const superAdminEmail = 'superadmin@taskflow.com';
  const commonPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(commonPassword, 12);

  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (superAdmin) {
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: {
        email: superAdminEmail,
        password: hashedPassword,
        isActive: true,
        mustResetPassword: false
      }
    });
  } else {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: superAdminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        mustResetPassword: false
      }
    });
  }

  console.log('Creating 2 Admins...');
  const admins = [];
  for (let i = 1; i <= 2; i++) {
    const email = `admin${i}@taskflow.com`;
    const user = await prisma.user.create({
      data: {
        name: `Admin ${i}`,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        mustResetPassword: false
      }
    });
    admins.push(user);
    console.log(`Created admin: ${email}`);
  }

  console.log('Creating 3 Project Managers...');
  const managers = [];
  for (let i = 1; i <= 3; i++) {
    const email = `manager${i}@taskflow.com`;
    const user = await prisma.user.create({
      data: {
        name: `Manager ${i}`,
        email,
        password: hashedPassword,
        role: 'PROJECT_MANAGER',
        isActive: true,
        mustResetPassword: false
      }
    });
    managers.push(user);
    console.log(`Created manager: ${email}`);
  }

  console.log('Creating 5 Collaborators...');
  const collaborators = [];
  for (let i = 1; i <= 5; i++) {
    const email = `collab${i}@taskflow.com`;
    const user = await prisma.user.create({
      data: {
        name: `Collaborator ${i}`,
        email,
        password: hashedPassword,
        role: 'COLLABORATOR',
        isActive: true,
        mustResetPassword: false
      }
    });
    collaborators.push(user);
    console.log(`Created collaborator: ${email}`);
  }

  console.log('Creating Default Labels...');
  const backendLabel = await prisma.label.create({ data: { name: 'Backend', color: 'blue' } });
  const frontendLabel = await prisma.label.create({ data: { name: 'Frontend', color: 'purple' } });
  const devopsLabel = await prisma.label.create({ data: { name: 'DevOps', color: 'rose' } });

  console.log('Creating 3 Projects owned by different managers...');
  // Project 1: Manager 1
  const project1 = await prisma.project.create({
    data: {
      name: 'Alpha Backend Services',
      description: 'Core backend RESTful API services and microservices architecture.',
      ownerId: managers[0].id
    }
  });
  // Project 2: Manager 2
  const project2 = await prisma.project.create({
    data: {
      name: 'Beta React client',
      description: 'Responsive React SPA interface using Tailwind CSS and Vite.',
      ownerId: managers[1].id
    }
  });
  // Project 3: Manager 3
  const project3 = await prisma.project.create({
    data: {
      name: 'Gamma DevOps Pipeline',
      description: 'CI/CD pipeline implementation, Kubernetes orchestrations, and cloud staging setups.',
      ownerId: managers[2].id
    }
  });

  console.log('Adding Project Memberships...');
  // Project 1 members: manager1, collab1, collab2, collab3
  const p1Members = [managers[0].id, collaborators[0].id, collaborators[1].id, collaborators[2].id];
  for (const userId of p1Members) {
    await prisma.projectMember.create({ data: { projectId: project1.id, userId } });
  }

  // Project 2 members: manager2, collab3, collab4, collab5
  const p2Members = [managers[1].id, collaborators[2].id, collaborators[3].id, collaborators[4].id];
  for (const userId of p2Members) {
    await prisma.projectMember.create({ data: { projectId: project2.id, userId } });
  }

  // Project 3 members: manager3, collab1, collab5
  const p3Members = [managers[2].id, collaborators[0].id, collaborators[4].id];
  for (const userId of p3Members) {
    await prisma.projectMember.create({ data: { projectId: project3.id, userId } });
  }

  console.log('Creating Tasks and Assignments...');
  const dateOffset = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // Tasks in Project 1 (Alpha Backend Services)
  const task1 = await prisma.task.create({
    data: {
      title: 'Design System Database Schema',
      description: 'Draft the ER diagrams, define models in Prisma, and verify foreign constraints.',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: dateOffset(3),
      projectId: project1.id,
      createdById: managers[0].id,
      labels: { connect: [{ id: backendLabel.id }] },
      assignments: { create: [{ userId: collaborators[0].id }] }
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Setup Authentication Middleware',
      description: 'Integrate JWT validation, rate limiting, and password reset workflows.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: dateOffset(5),
      projectId: project1.id,
      createdById: managers[0].id,
      labels: { connect: [{ id: backendLabel.id }] },
      assignments: { create: [{ userId: collaborators[1].id }] }
    }
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Configure Boilerplate Linter rules',
      description: 'Setup basic configurations for ESLint on the backend directory.',
      status: 'COMPLETED',
      completedAt: new Date(),
      priority: 'LOW',
      dueDate: dateOffset(-1),
      projectId: project1.id,
      createdById: managers[0].id,
      assignments: { create: [{ userId: collaborators[0].id }] }
    }
  });

  // Tasks in Project 2 (Beta React client)
  await prisma.task.create({
    data: {
      title: 'Develop Sidebar Navigation Layout',
      description: 'Create a slide-over panel navigation component for the workspace pages.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: dateOffset(4),
      projectId: project2.id,
      createdById: managers[1].id,
      labels: { connect: [{ id: frontendLabel.id }] },
      assignments: { create: [{ userId: collaborators[2].id }] }
    }
  });

  await prisma.task.create({
    data: {
      title: 'Integrate Socket.io Real-Time inbox updates',
      description: 'Implement live listener hook inside NotificationContext for instant updates.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: dateOffset(2),
      projectId: project2.id,
      createdById: managers[1].id,
      labels: { connect: [{ id: frontendLabel.id }] },
      assignments: {
        create: [
          { userId: collaborators[3].id },
          { userId: collaborators[4].id }
        ]
      }
    }
  });

  // Tasks in Project 3 (Gamma DevOps Pipeline)
  await prisma.task.create({
    data: {
      title: 'Deploy Staging Docker clusters',
      description: 'Write Dockerfiles and setup continuous delivery pipelines with AWS container deployment.',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: dateOffset(6),
      projectId: project3.id,
      createdById: managers[2].id,
      labels: { connect: [{ id: devopsLabel.id }] },
      assignments: { create: [{ userId: collaborators[4].id }] }
    }
  });

  console.log('Seeding Activities for Tasks...');
  await prisma.activity.create({
    data: {
      projectId: project1.id,
      userId: managers[0].id,
      action: `Manager 1 created this task | task:${task1.id}`
    }
  });

  await prisma.activity.create({
    data: {
      projectId: project1.id,
      userId: managers[0].id,
      action: `Manager 1 created this task | task:${task2.id}`
    }
  });

  await prisma.activity.create({
    data: {
      projectId: project1.id,
      userId: collaborators[1].id,
      action: `Collaborator 2 changed status to IN_PROGRESS | task:${task2.id}`
    }
  });

  await prisma.activity.create({
    data: {
      projectId: project1.id,
      userId: collaborators[0].id,
      action: `Collaborator 1 completed this task | task:${task3.id}`
    }
  });

  console.log('Seeding some seed comments for testing details...');
  await prisma.comment.create({
    data: {
      body: 'I will start looking at the database indices tomorrow.',
      taskId: task1.id,
      authorId: collaborators[0].id
    }
  });

  await prisma.comment.create({
    data: {
      body: 'Make sure we follow the 1-to-many relationship structures properly.',
      taskId: task1.id,
      authorId: managers[0].id
    }
  });

  console.log('\n=============================================================');
  console.log('Database seeded with standard test records successfully! 🚀');
  console.log('All users have password: Password123!');
  console.log('=============================================================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding test database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
