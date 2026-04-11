import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testResponse() {
  const userId = "38464c45-d187-417b-aa63-b6581b46eced"; // Example user Kinda
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const response = {
    success: true,
    count: notifications.length,
    notifications
  };

  console.log("Mocked Response:");
  console.log(JSON.stringify(response, null, 2));
}

testResponse().finally(() => prisma.$disconnect());
