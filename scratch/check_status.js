import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const n = await prisma.notification.findUnique({
    where: { id: "52670c04-03a6-46ca-93b5-2a77d0511e3d" }
  });
  console.log(JSON.stringify(n, null, 2));
}

check().finally(() => prisma.$disconnect());
