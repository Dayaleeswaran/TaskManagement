const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing mock records...');
  // Delete records in reverse order of dependencies to avoid foreign key errors
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.auditLog.deleteMany({});

  // Delete all users except the Super Admin
  console.log('Removing mock users (except Super Admin)...');
  await prisma.user.deleteMany({
    where: {
      role: { not: 'SUPER_ADMIN' }
    }
  });

  console.log('Checking if Super Admin exists...');
  const superAdminExists = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!superAdminExists) {
    console.log('No Super Admin found. Seeding default Super Admin...');
    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@taskflow.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin2026!';
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        mustResetPassword: false,
      }
    });
    console.log('Super Admin seeded successfully.');
  } else {
    console.log('Super Admin already exists. Keeping it.');
  }

  console.log('Database cleaned and Super Admin verified successfully! ✅');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
