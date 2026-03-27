import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mealCategories = {
    BREAKFAST: [
        { name: "زبادي يوناني مع التوت", calories: 320, fats: 10, proteins: 15, carbs: 40, ingredients: ["150غ زبادي يوناني", "50غ توت", "ملعقة عسل"], imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777", incompatibleDiseases: [] },
        { name: "شوفان بالحليب والموز", calories: 350, fats: 5, proteins: 12, carbs: 60, ingredients: ["نصف كوب شوفان", "كوب حليب", "موزة مقطعة"], imageUrl: "https://images.unsplash.com/photo-1517673400267-0251440c45dc", incompatibleDiseases: ["السكري"] },
        { name: "بيض مسلوق مع خبز أسمر", calories: 280, fats: 10, proteins: 14, carbs: 30, ingredients: ["حبتين بيض مسلوق", "شريحتين خبز أسمر"], imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "أومليت بالخضار", calories: 310, fats: 15, proteins: 16, carbs: 20, ingredients: ["حبتين بيض", "ربع كوب خضار مشكلة", "ملعقة زيت زيتون"], imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "توست الأفوكادو", calories: 340, fats: 18, proteins: 8, carbs: 35, ingredients: ["شريحة خبز توست", "نصف حبة أفوكادو مهروسة", "رشة ملح وفلفل"], imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8", incompatibleDiseases: [] }
    ],
    LUNCH: [
        { name: "سلطة دجاج مشوي", calories: 420, fats: 15, proteins: 35, carbs: 25, ingredients: ["150غ صدر دجاج مشوي", "كوبين خس", "طماطم وخيار", "ملعقتين صلصة خل وزيت"], imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", incompatibleDiseases: [] },
        { name: "سلمون مشوي مع أرز بني", calories: 550, fats: 20, proteins: 40, carbs: 50, ingredients: ["150غ فيليه سلمون", "كوب أرز بني مسلوق", "نصف كوب خضار سوتيه"], imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288", incompatibleDiseases: [] },
        { name: "مكرونة قمح كامل بصلصة الطماطم", calories: 480, fats: 10, proteins: 15, carbs: 80, ingredients: ["كوب مكرونة مسلوقة", "نصف كوب صلصة طماطم طبيعية", "ملعقة جبن مبشور"], imageUrl: "https://images.unsplash.com/photo-1473093226795-af9932fe5856", incompatibleDiseases: ["السكري"] },
        { name: "كفتة مشوية مع سلطة", calories: 450, fats: 25, proteins: 30, carbs: 20, ingredients: ["150غ لحم مفروم مشوي", "بصل وبقدونس", "سلطة تبولة صغيرة"], imageUrl: "https://images.unsplash.com/photo-1598514983318-2f64f8f4796c", incompatibleDiseases: ["أمراض القلب", "ارتفاع ضغط الدم"] },
        { name: "عدس مطهو (شوربة أو مجدرة)", calories: 400, fats: 8, proteins: 18, carbs: 60, ingredients: ["كوب ونصف عدس مطبوخ", "بصل مقلي", "بهارات"], imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd", incompatibleDiseases: [] }
    ],
    DINNER: [
        { name: "سمك السلمون المشوي مع الخضار", calories: 480, fats: 18, proteins: 35, carbs: 25, ingredients: ["شريحة سلمون", "كوب بروكلي وجزر", "ملعقة زيتون"], imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288", incompatibleDiseases: [] },
        { name: "تونة مع سلطة خضراء", calories: 300, fats: 10, proteins: 28, carbs: 15, ingredients: ["علبة تونة مصفاة من الزيت", "خس وجرجير", "عصير ليمون"], imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", incompatibleDiseases: ["ارتفاع ضغط الدم"] },
        { name: "صدر دجاج بالليمون والثوم", calories: 350, fats: 8, proteins: 35, carbs: 10, ingredients: ["150غ صدر دجاج", "عصير حبة ليمون", "حبتين ثوم مهروس"], imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435", incompatibleDiseases: [] },
        { name: "جبنة قريش مع فواكه", calories: 250, fats: 5, proteins: 20, carbs: 25, ingredients: ["كوب جبنة قريش", "نصف تفاحة أو بطيخ", "رشة جوز"], imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777", incompatibleDiseases: ["أمراض الكلى المزمنة"] },
        { name: "شوربة خضار دافئة", calories: 200, fats: 5, proteins: 5, carbs: 30, ingredients: ["كوب مرق", "جزر بطاطس كوسا", "ملح وفلفل"], imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd", incompatibleDiseases: [] }
    ],
    SNACK: [
        { name: "تفاح ولوز", calories: 180, fats: 9, proteins: 6, carbs: 22, ingredients: ["تفاحة متوسطة مقطعة", "20غ لوز نيء", "5غ عسل (اختياري)", "رشة قرفة"], imageUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af", incompatibleDiseases: [] },
        { name: "مكسرات مشكلة", calories: 200, fats: 18, proteins: 7, carbs: 8, ingredients: ["30غ مكسرات غير مملحة (كاجو، جوز، لوز)"], imageUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af", incompatibleDiseases: [] },
        { name: "زبادي سادة", calories: 120, fats: 4, proteins: 8, carbs: 10, ingredients: ["علبة زبادي 150غ"], imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777", incompatibleDiseases: [] },
        { name: "تمر وجوز", calories: 220, fats: 10, proteins: 3, carbs: 35, ingredients: ["3 حبات تمر", "نصف كوب جوز"], imageUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af", incompatibleDiseases: ["السكري"] }
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
                        proteins: mealReq.proteins,
                        fats: mealReq.fats,
                        carbs: mealReq.carbs,
                        ingredients: mealReq.ingredients,
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
