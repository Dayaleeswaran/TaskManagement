const prisma = require("../prisma");
const bcrypt = require("bcrypt");

async function seedSuperAdmin() {
  try {
    const superAdminExists = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (!superAdminExists) {
      console.log("No Super Admin found in database. Initializing seeding...");

      const email = process.env.SUPER_ADMIN_EMAIL || "superadmin@taskflow.com";
      const password = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin2026!";

      console.log(`Seeding Super Admin user with email: ${email}`);

      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.create({
        data: {
          name: "Super Admin",
          email: email.toLowerCase(),
          password: hashedPassword,
          role: "SUPER_ADMIN",
          isActive: true,
          mustResetPassword: false, // Super Admin doesn't need to force reset on seed creation
        },
      });

      console.log("Super Admin seeded successfully.");
    }
  } catch (err) {
    console.error("Error seeding Super Admin:", err);
  }
}

module.exports = { seedSuperAdmin };
