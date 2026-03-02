import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const diseases = [
        { name: "السكري", type: "DISEASE" },
        { name: "ارتفاع ضغط الدم", type: "DISEASE" },
        { name: "أمراض القلب", type: "DISEASE" },
        { name: "اضطرابات الغدة الدرقية", type: "DISEASE" },
        { name: "الربو", type: "DISEASE" },
        { name: "ارتفاع الكوليسترول", type: "DISEASE" },
        { name: "فقر الدم", type: "DISEASE" },
        { name: "أمراض الكلى المزمنة", type: "DISEASE" },
        { name: "أمراض الكبد المزمنة", type: "DISEASE" },
        { name: "أمراض الروماتيزم المزمنة", type: "DISEASE" },
    ];

    console.log("Seeding chronic diseases...");

    for (const item of diseases) {
        // Upsert ensures we don't create duplicates if run multiple times
        // (using First because we don't have a unique constraint on 'name')
        const existing = await prisma.chronicDiseases.findFirst({
            where: { name: item.name }
        });

        if (!existing) {
            await prisma.chronicDiseases.create({
                data: item
            });
            console.log(`- Created: ${item.name}`);
        } else {
            console.log(`- Already exists: ${item.name}`);
        }
    }

    console.log("Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
