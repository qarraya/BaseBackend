import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mealCategories = {
    BREAKFAST: [
        { name: "زبادي يوناني مع التوت", calories: 320, imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777" },
        { name: "شوفان بالحليب والموز", calories: 350, imageUrl: "https://images.unsplash.com/photo-1517673400267-0251440c45dc" },
        { name: "بيض مسلوق مع خبز أسمر", calories: 280, imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8" },
        { name: "أومليت بالخضار", calories: 310, imageUrl: "https://images.unsplash.com/photo-1494597564530-811f0a97ac3d" },
        { name: "توست الأفوكادو", calories: 340, imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8" }
    ],
    LUNCH: [
        { name: "سلطة دجاج مشوي", calories: 420, imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c" },
        { name: "سلمون مشوي مع أرز بني", calories: 550, imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288" },
        { name: "مكرونة قمح كامل بصلصة الطماطم", calories: 480, imageUrl: "https://images.unsplash.com/photo-1473093226795-af9932fe5856" },
        { name: "كفتة مشوية مع سلطة", calories: 450, imageUrl: "https://images.unsplash.com/photo-1529006557870-17482574e48b" },
        { name: "عدس مطهو (شوربة أو مجدرة)", calories: 400, imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd" }
    ],
    DINNER: [
        { name: "سمك السلمون المشوي مع الخضار", calories: 480, imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288" },
        { name: "تونة مع سلطة خضراء", calories: 300, imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c" },
        { name: "صدر دجاج بالليمون والثوم", calories: 350, imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435" },
        { name: "جبنة قريش مع فواكه", calories: 250, imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777" },
        { name: "شوربة خضار دافئة", calories: 200, imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd" }
    ],
    SNACK: [
        { name: "تفاح ولوز", calories: 180, imageUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af" },
        { name: "مكسرات مشكلة", calories: 200, imageUrl: "https://images.unsplash.com/photo-1536620453303-34e2c94d688c" },
        { name: "زبادي سادة", calories: 120, imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777" },
        { name: "تمر وجوز", calories: 220, imageUrl: "https://images.unsplash.com/photo-1505253505346-6330b6e9273c" }
    ]
};

async function main() {
    console.log("Seeding meals...");

    for (const [time, meals] of Object.entries(mealCategories)) {
        for (const mealReq of meals) {
            const existing = await prisma.meal.findFirst({
                where: { name: mealReq.name }
            });

            if (!existing) {
                await prisma.meal.create({
                    data: {
                        name: mealReq.name,
                        calories: mealReq.calories,
                        imageUrl: mealReq.imageUrl,
                        time: time // Enum matching: "BREAKFAST", "LUNCH"...
                    }
                });
                console.log(`- Created: ${mealReq.name} (${time})`);
            } else {
                console.log(`- Already exists: ${mealReq.name}`);
            }
        }
    }

    console.log("Seeding meals finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
