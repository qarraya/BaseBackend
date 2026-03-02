import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log("Total users:", users.length);

    users.forEach(u => {
        console.log(`- Username: "${u.username}", Email: "${u.email}", Password (hashed?): ${u.password.startsWith('$2')}`);
    });
}

main()
    .catch(e => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
