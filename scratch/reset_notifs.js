import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function reset() {
  const res = await prisma.notification.updateMany({
    data: { isRead: false }
  });
  console.log(`Reset ${res.count} notifications to UNREAD status.`);
}

reset().finally(() => prisma.$disconnect());
