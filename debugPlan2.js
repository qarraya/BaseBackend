import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.plan.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1
}).then(console.log).finally(() => prisma.$disconnect());
