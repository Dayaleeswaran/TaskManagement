const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking if Super Admin exists...');
  const email = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@taskflow.com').toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin2026!';
  const hashedPassword = await bcrypt.hash(password, 12);

  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!superAdmin) {
    console.log('No Super Admin found. Seeding default Super Admin...');
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: email,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        mustResetPassword: false,
      }
    });
    console.log('Super Admin seeded successfully.');
  } else {
    console.log('Super Admin exists. Updating credentials to match current environment...');
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: {
        email: email,
        password: hashedPassword,
      }
    });
    console.log('Super Admin credentials updated successfully.');
  }

  console.log('Super Admin verified successfully! ✅');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
