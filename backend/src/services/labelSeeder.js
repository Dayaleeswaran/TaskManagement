const prisma = require("../prisma");

const defaultLabels = [
  { name: "BUG", color: "red" },
  { name: "FEATURE", color: "green" },
  { name: "URGENT", color: "orange" },
  { name: "DOCUMENTATION", color: "blue" },
  { name: "REFACTOR", color: "purple" },
];

async function seedDefaultLabels() {
  try {
    const count = await prisma.label.count();
    if (count === 0) {
      console.log("No labels found in database. Seeding default labels...");
      await prisma.label.createMany({
        data: defaultLabels,
        skipDuplicates: true,
      });
      console.log("Default labels seeded successfully.");
    }
  } catch (err) {
    console.error("Error seeding default labels:", err);
  }
}

module.exports = { seedDefaultLabels };
