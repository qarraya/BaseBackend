import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const notifs = await prisma.notification.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log(JSON.stringify(notifs, null, 2));
}
main().finally(() => prisma.$disconnect());
