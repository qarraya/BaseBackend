import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mealCategories = {
    BREAKFAST: [
        { name: "زبادي يوناني مع التوت", calories: 320, imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777", incompatibleDiseases: [] },
        { name: "شوفان بالحليب والموز", calories: 350, imageUrl: "https://images.unsplash.com/photo-1517673400267-0251440c45dc", incompatibleDiseases: ["السكري"] }, // مثال: الموز يرفع السكر المسترد سريعا
        { name: "بيض مسلوق مع خبز أسمر", calories: 280, imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8", incompatibleDiseases: ["ارتفاع الكوليسترول"] }, // مثال: صفار البيض
        { name: "أومليت بالخضار", calories: 310, imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "توست الأفوكادو", calories: 340, imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8", incompatibleDiseases: [] }
    ],
    LUNCH: [
        { name: "سلطة دجاج مشوي", calories: 420, imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", incompatibleDiseases: [] },
        { name: "سلمون مشوي مع أرز بني", calories: 550, imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288", incompatibleDiseases: [] },
        { name: "مكرونة قمح كامل بصلصة الطماطم", calories: 480, imageUrl: "https://images.unsplash.com/photo-1473093226795-af9932fe5856", incompatibleDiseases: ["السكري"] }, // كاربوهيدرات
        { name: "كفتة مشوية مع سلطة", calories: 450, imageUrl: "https://images.unsplash.com/photo-1598514983318-2f64f8f4796c", incompatibleDiseases: ["أمراض القلب", "ارتفاع ضغط الدم"] }, // لحم أحمر مدهن
        { name: "عدس مطهو (شوربة أو مجدرة)", calories: 400, imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd", incompatibleDiseases: [] }
    ],
    DINNER: [
        { name: "سمك السلمون المشوي مع الخضار", calories: 480, imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288", incompatibleDiseases: [] },
        { name: "تونة مع سلطة خضراء", calories: 300, imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", incompatibleDiseases: ["ارتفاع ضغط الدم"] }, // الصوديوم في المعلبات
        { name: "صدر دجاج بالليمون والثوم", calories: 350, imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435", incompatibleDiseases: [] },
        { name: "جبنة قريش مع فواكه", calories: 250, imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777", incompatibleDiseases: ["أمراض الكلى المزمنة"] }, // فواكه وجبن للبروتين العالي
        { name: "شوربة خضار دافئة", calories: 200, imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd", incompatibleDiseases: [] }
    ],
    SNACK: [
        { name: "تفاح ولوز", calories: 180, imageUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af", incompatibleDiseases: [] },
        { name: "مكسرات مشكلة", calories: 200, imageUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af", incompatibleDiseases: [] },
        { name: "زبادي سادة", calories: 120, imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777", incompatibleDiseases: [] },
        { name: "تمر وجوز", calories: 220, imageUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af", incompatibleDiseases: ["السكري"] } // تمر سكرياته عالية
    ]
};

async function main() {
    console.log("Seeding meals...");

    // 1- Fetch all diseases to get their IDs
    const allDiseases = await prisma.chronicDiseases.findMany();
    const diseaseMap = {};
    allDiseases.forEach(d => {
        diseaseMap[d.name] = d.id;
    });

    for (const [time, meals] of Object.entries(mealCategories)) {
        for (const mealReq of meals) {
            const existing = await prisma.meal.findFirst({
                where: { name: mealReq.name }
            });

            if (!existing) {
                // Map the names to IDs from the DB
                const connections = mealReq.incompatibleDiseases
                    .filter(diseaseName => diseaseMap[diseaseName]) // Ensure disease exists
                    .map(diseaseName => ({
                        chronicDiseases: {
                            connect: { id: diseaseMap[diseaseName] }
                        }
                    }));

                await prisma.meal.create({
                    data: {
                        name: mealReq.name,
                        calories: mealReq.calories,
                        imageUrl: mealReq.imageUrl,
                        time: time, // Enum matching: "BREAKFAST", "LUNCH"...
                        chromicDiseases: {
                            create: connections
                        }
                    }
                });
                console.log(`- Created: ${mealReq.name} (${time}) with ${connections.length} restrictions`);
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
