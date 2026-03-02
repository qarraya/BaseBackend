import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const diseases = await prisma.chronicDiseases.findMany();
    console.table(diseases.map(d => ({ Name: d.name, ID: d.id })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
