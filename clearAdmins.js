import prisma from "./lib/prisma.js";

async function deleteAllAdmins() {
  try {
    const deleted = await prisma.admin.deleteMany({});
    console.log(`Successfully deleted ${deleted.count} admins.`);
  } catch (error) {
    console.error("Error deleting admins:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllAdmins();
