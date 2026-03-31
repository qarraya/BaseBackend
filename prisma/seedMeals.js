import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mealCategories = {
    BREAKFAST: [
        { name: "زبادي يوناني مع التوت", calories: 221, portion: "200غ", fats: 8.3, proteins: 12.5, carbs: 24, ingredients: ["150غ زبادي يوناني", "50غ توت", "ملعقة عسل"], imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777", incompatibleDiseases: [] },
        { name: "شوفان بالحليب والموز", calories: 422, portion: "250غ", fats: 11.3, proteins: 14, carbs: 66, ingredients: ["نصف كوب شوفان", "كوب حليب", "موزة مقطعة"], imageUrl: "https://images.unsplash.com/photo-1517673400267-0251440c45dc", incompatibleDiseases: ["السكري"] },
        { name: "بيض مسلوق مع خبز أسمر", calories: 296, portion: "150غ", fats: 12, proteins: 18, carbs: 29, ingredients: ["حبتين بيض مسلوق", "شريحتين خبز أسمر"], imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHo5K9raOvO52pwudKc2fUcVod8SZ6gpzzkw&s", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "أومليت بالخضار", calories: 288, portion: "200غ", fats: 24, proteins: 13, carbs: 5, ingredients: ["حبتين بيض", "ربع كوب خضار مشكلة", "ملعقة زيت زيتون"], imageUrl: "https://www.mygorgeousrecipes.com/wp-content/uploads/2018/02/Vegetarian-Omelette-1.jpg", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "توست الأفوكادو", calories: 236, portion: "150غ", fats: 12, proteins: 5, carbs: 27, ingredients: ["شريحة خبز توست", "نصف حبة أفوكادو مهروسة", "رشة ملح وفلفل"], imageUrl: "https://cookingwithcoit.com/wp-content/uploads/2021/04/HERO_Avocado-Toast.jpg", incompatibleDiseases: [] }
    ],
    LUNCH: [
        { name: "سلطة دجاج مشوي", calories: 344, portion: "300غ", fats: 20, proteins: 32, carbs: 9, ingredients: ["150غ صدر دجاج مشوي", "كوبين خس", "طماطم وخيار", "ملعقتين صلصة خل وزيت"], imageUrl: "https://www.greatgrubdelicioustreats.com/wp-content/uploads/2022/05/Grilled_Chicken_Salad_13.jpg", incompatibleDiseases: [] },
        { name: "سلمون مشوي مع أرز بني", calories: 540, portion: "350غ", fats: 20, proteins: 40, carbs: 50, ingredients: ["150غ فيليه سلمون", "كوب أرز بني مسلوق", "نصف كوب خضار سوتيه"], imageUrl: "https://www.healthyfood.com/wp-content/uploads/2016/11/Teriyaki-salmon-with-stir-fried-greens-and-brown-rice-1.jpg", incompatibleDiseases: [] },
        { name: "معكرونة قمح كامل بصلصة الطماطم", calories: 305, portion: "300غ", fats: 4.5, proteins: 12, carbs: 54, ingredients: ["كوب مكرونة مسلوقة", "نصف كوب صلصة طماطم طبيعية", "ملعقة جبن مبشور"], imageUrl: "https://fortheloveofcooking.net/wp-content/uploads/2012/04/DSC_6314-2-scaled.jpg", incompatibleDiseases: ["السكري"] },
        { name: "كفتة مشوية مع سلطة", calories: 334, portion: "250غ", fats: 21.5, proteins: 26.5, carbs: 8.5, ingredients: ["150غ لحم مفروم مشوي", "بصل وبقدونس", "سلطة تبولة صغيرة"], imageUrl: "https://images.themodernproper.com/production/posts/2020/Beef-Kofta-12.jpg?w=1200&h=1200&q=60&fm=jpg&fit=crop&dm=1683266321&s=51d6a810051f11ed9a22ea54dd0bba1f", incompatibleDiseases: ["أمراض القلب", "ارتفاع ضغط الدم"] },
        { name: "مجدرة", calories: 397, portion: "350غ", fats: 5, proteins: 18, carbs: 70, ingredients: ["كوب عدس مطبوخ", "نصف كوب أرز مسلوق", "بصل مقلي", "بهارات"], imageUrl: "https://static01.nyt.com/images/2025/05/15/multimedia/ND-Mujadara-kzgm/ND-Mujadara-kzgm-mediumSquareAt3X.jpg", incompatibleDiseases: [] }
    ],
    DINNER: [
        { name: "سمك السلمون المشوي مع الخضار", calories: 402, portion: "300غ", fats: 18, proteins: 35, carbs: 25, ingredients: ["شريحة سلمون", "كوب بروكلي وجزر", "ملعقة زيتون"], imageUrl: "https://static.vecteezy.com/system/resources/previews/050/897/358/non_2x/grilled-salmon-fillet-served-with-broccoli-and-quinoa-on-a-white-plate-photo.jpeg", incompatibleDiseases: [] },
        { name: "تونة مع سلطة خضراءء", calories: 262, portion: "250غ", fats: 10, proteins: 28, carbs: 15, ingredients: ["علبة تونة مصفاة من الزيت", "خس وجرجير", "عصير ليمون"], imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c", incompatibleDiseases: ["ارتفاع ضغط الدم"] },
        { name: "صدر دجاج بالليمون والثوم", calories: 252, portion: "200غ", fats: 8, proteins: 35, carbs: 10, ingredients: ["150غ صدر دجاج", "عصير حبة ليمون", "حبتين ثوم مهروس"], imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435", incompatibleDiseases: [] },
        { name: "جبنة قريش مع فواكه", calories: 225, portion: "200غ", fats: 5, proteins: 20, carbs: 25, ingredients: ["كوب جبنة قريش", "نصف تفاحة أو بطيخ", "رشة جوز"], imageUrl: "https://www.justfood.tv/big/0cheese%20fruits.jpg", incompatibleDiseases: ["أمراض الكلى المزمنة"] },
        { name: "شوربة خضار دافئة", calories: 185, portion: "300غ", fats: 5, proteins: 5, carbs: 30, ingredients: ["كوب مرق", "جزر بطاطس كوسا", "ملح وفلفل"], imageUrl: "https://thefastrecipe.com/wp-content/uploads/2024/08/italian-zucchini-soup-rice.jpg", incompatibleDiseases: [] }
    ],
    SNACK: [
        { name: "تفاح ولوز", calories: 193, portion: "150غ", fats: 9, proteins: 6, carbs: 22, ingredients: ["تفاحة متوسطة مقطعة", "20 غ لوز ني", "5غ عسل (اختياري)", "رشة قرفة"], imageUrl: "https://images.unsplash.com/photo-1490818387583-1baba5e638af", incompatibleDiseases: [] },
        { name: "مكسرات مشكلة", calories: 222, portion: "30غ", fats: 18, proteins: 7, carbs: 8, ingredients: ["30غ مكسرات غير مملحة (كاجو، جوز، لوز)"], imageUrl: "https://i0.wp.com/images-prod.healthline.com/hlcmsresource/images/mixed-nuts-in-bowl.jpg?w=1155&h=1528", incompatibleDiseases: [] },
        { name: "زبادي سادة", calories: 108, portion: "150غ", fats: 4, proteins: 8, carbs: 10, ingredients: ["علبة زبادي 150غ"], imageUrl: "https://www.karlijnskitchen.com/wp-content/uploads/2023/04/Yoghurt-maken-in-de-crockpot-express-2.jpg", incompatibleDiseases: [] },
        { name: "تمر وجوز", calories: 242, portion: "50غ", fats: 10, proteins: 3, carbs: 35, ingredients: ["3 حبات تمر", "نصف كوب جوز"], imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQk6e9_SBEJzCfr8bXIQrRsPSZ6BP5INeU-Zw&s", incompatibleDiseases: ["السكري"] }
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
                        portion: mealReq.portion,
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
                await prisma.meal.update({
                    where: { id: existing.id },
                    data: { imageUrl: mealReq.imageUrl }
                });
                console.log(`- Updated imageUrl for: ${mealReq.name}`);
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
