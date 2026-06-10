import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clear existing records in reverse order of relations
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // Create initial profiles
  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@tms.com',
      passwordHash,
      role: Role.ADMIN,
      requiresPasswordReset: true,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Project Manager',
      email: 'manager@tms.com',
      passwordHash,
      role: Role.PROJECT_MANAGER,
      requiresPasswordReset: true,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Collaborator',
      email: 'collaborator@tms.com',
      passwordHash,
      role: Role.COLLABORATOR,
      requiresPasswordReset: true,
      isActive: true,
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