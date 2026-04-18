import "../loadEnv.js";
import { PrismaClient } from "@prisma/client";
import { kcalFromMacros } from "../utils/macros.js";

const prisma = new PrismaClient();

// calories: قيمة مرجعية (4P + 4C + 9F)؛ ما يُحفظ في DB يُشتق دائماً من الماكروز عبر kcalFromMacros
const mealCategories = {
    BREAKFAST: [
        { name: "زبادي يوناني مع التوت", calories: 221, portion: "200غ", fats: 8.3, proteins: 12.5, carbs: 24, ingredients: ["150غ زبادي يوناني", "50غ توت", "ملعقة عسل"], imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777", incompatibleDiseases: [] },
        { name: "شوفان بالحليب والموز", calories: 422, portion: "250غ", fats: 11.3, proteins: 14, carbs: 66, ingredients: ["نصف كوب شوفان", "كوب حليب", "موزة مقطعة"], imageUrl: "https://images.unsplash.com/photo-1517673400267-0251440c45dc", incompatibleDiseases: ["السكري"] },
        { name: "بيض مسلوق مع خبز أسمر", calories: 296, portion: "150غ", fats: 12, proteins: 18, carbs: 29, ingredients: ["حبتين بيض مسلوق", "شريحتين خبز أسمر"], imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&q=80", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "أومليت بالخضار", calories: 288, portion: "200غ", fats: 24, proteins: 13, carbs: 5, ingredients: ["حبتين بيض", "ربع كوب خضار مشكلة", "ملعقة زيت زيتون"], imageUrl: "https://www.mygorgeousrecipes.com/wp-content/uploads/2018/02/Vegetarian-Omelette-1.jpg", incompatibleDiseases: ["ارتفاع الكوليسترول"] },
        { name: "توست الأفوكادو", calories: 236, portion: "150غ", fats: 12, proteins: 5, carbs: 27, ingredients: ["شريحة خبز توست", "نصف حبة أفوكادو مهروسة", "رشة ملح وفلفل"], imageUrl: "https://cookingwithcoit.com/wp-content/uploads/2021/04/HERO_Avocado-Toast.jpg", incompatibleDiseases: [] }
    ],
    LUNCH: [
        { name: "سلطة دجاج مشوي", calories: 344, portion: "300غ", fats: 20, proteins: 32, carbs: 9, ingredients: ["150غ صدر دجاج مشوي", "كوبين خس", "طماطم وخيار", "ملعقتين صلصة خل وزيت"], imageUrl: "https://www.greatgrubdelicioustreats.com/wp-content/uploads/2022/05/Grilled_Chicken_Salad_13.jpg", incompatibleDiseases: [] },
        { name: "سلمون مشوي مع أرز بني", calories: 540, portion: "350غ", fats: 20, proteins: 40, carbs: 50, ingredients: ["150غ فيليه سلمون", "كوب أرز بني مسلوق", "نصف كوب خضار سوتيه"], imageUrl: "https://shamlola.s3.amazonaws.com/Shamlola_Images/5/src/c6b35a1040af8d023392c6f9a328b2d43e2b8f80.jpg", incompatibleDiseases: [] },
        { name: "معكرونة قمح كامل بصلصة الطماطم", calories: 305, portion: "300غ", fats: 4.5, proteins: 12, carbs: 54, ingredients: ["كوب مكرونة مسلوقة", "نصف كوب صلصة طماطم طبيعية", "ملعقة جبن مبشور"], imageUrl: "https://fortheloveofcooking.net/wp-content/uploads/2012/04/DSC_6314-2-scaled.jpg", incompatibleDiseases: ["السكري"] },
        { name: "كفتة مشوية مع سلطة", calories: 334, portion: "250غ", fats: 21.5, proteins: 26.5, carbs: 8.5, ingredients: ["150غ لحم مفروم مشوي", "بصل وبقدونس", "سلطة تبولة صغيرة"], imageUrl: "https://images.themodernproper.com/production/posts/2020/Beef-Kofta-12.jpg?w=1200&h=1200&q=60&fm=jpg&fit=crop&dm=1683266321&s=51d6a810051f11ed9a22ea54dd0bba1f", incompatibleDiseases: ["أمراض القلب", "ارتفاع ضغط الدم"] },
        { name: "مجدرة", calories: 397, portion: "350غ", fats: 5, proteins: 18, carbs: 70, ingredients: ["كوب عدس مطبوخ", "نصف كوب أرز مسلوق", "بصل مقلي", "بهارات"], imageUrl: "https://static01.nyt.com/images/2025/05/15/multimedia/ND-Mujadara-kzgm/ND-Mujadara-kzgm-mediumSquareAt3X.jpg", incompatibleDiseases: [] }
    ],
    DINNER: [
        { name: "سمك السلمون المشوي مع الخضار", calories: 402, portion: "300غ", fats: 18, proteins: 35, carbs: 25, ingredients: ["شريحة سلمون", "كوب بروكلي وجزر", "ملعقة زيتون"], imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=1200&q=80", incompatibleDiseases: [] },
        { name: "تونة مع سلطة خضراء", calories: 262, portion: "250غ", fats: 10, proteins: 28, carbs: 15, ingredients: ["علبة تونة مصفاة من الزيت", "خس وجرجير", "عصير ليمون"], imageUrl: "https://img.youm7.com/ArticleImgs/2017/6/23/84512-%D8%B7%D8%B1%D9%8A%D9%82%D8%A9-%D8%B9%D9%85%D9%84-%D8%B3%D9%84%D8%B7%D8%A9%D8%A7-%D9%84%D8%AA%D9%88%D9%86%D8%A91.jpeg", incompatibleDiseases: ["ارتفاع ضغط الدم"] },
        { name: "صدر دجاج بالليمون والثوم", calories: 252, portion: "200غ", fats: 8, proteins: 35, carbs: 10, ingredients: ["150غ صدر دجاج", "عصير حبة ليمون", "حبتين ثوم مهروس"], imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435", incompatibleDiseases: [] },
        { name: "جبنة قريش مع فواكه", calories: 225, portion: "200غ", fats: 5, proteins: 20, carbs: 25, ingredients: ["كوب جبنة قريش", "نصف تفاحة أو بطيخ", "رشة جوز"], imageUrl: "https://www.justfood.tv/big/0cheese%20fruits.jpg", incompatibleDiseases: ["أمراض الكلى المزمنة"] },
        { name: "شوربة خضار دافئة", calories: 185, portion: "300غ", fats: 5, proteins: 5, carbs: 30, ingredients: ["كوب مرق", "جزر بطاطس كوسا", "ملح وفلفل"], imageUrl: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?q=80&w=1200&auto=format&fit=crop", incompatibleDiseases: [] }
    ],
    SNACK: [
        { name: "تفاح ولوز", calories: 193, portion: "150غ", fats: 9, proteins: 6, carbs: 22, ingredients: ["تفاحة متوسطة مقطعة", "20 غ لوز ني", "5غ عسل (اختياري)", "رشة قرفة"], imageUrl: "https://tastefullygrace.com/wp-content/uploads/2023/11/Baked-Apples-Recipe-1.jpg", incompatibleDiseases: [] },
        { name: "مكسرات مشكلة", calories: 222, portion: "30غ", fats: 18, proteins: 7, carbs: 8, ingredients: ["30غ مكسرات غير مملحة (كاجو، جوز، لوز)"], imageUrl: "https://i0.wp.com/images-prod.healthline.com/hlcmsresource/images/mixed-nuts-in-bowl.jpg?w=1155&h=1528", incompatibleDiseases: [] },
        { name: "زبادي سادة", calories: 108, portion: "150غ", fats: 4, proteins: 8, carbs: 10, ingredients: ["علبة زبادي 150غ"], imageUrl: "https://png.pngtree.com/png-clipart/20231011/original/pngtree-labneh-png-with-ai-generated-png-image_13294690.png", incompatibleDiseases: [] },
        { name: "تمر وجوز", calories: 242, portion: "50غ", fats: 10, proteins: 3, carbs: 35, ingredients: ["3 حبات تمر", "نصف كوب جوز"], imageUrl: "https://www.israelcart.com/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2023/08/Davidpliner_beautifully_arranged_platter_of_Nut-Stuffed_Dates_w_70fede07-60be-499d-87d5-98b44de24b1f-1.png.webp", incompatibleDiseases: ["السكري"] }
    ]
};

async function main() {
    // لا نستخدم deleteMany: حذف الوجبات يزيل PlanMeal (Cascade) ويكسر خطط المستخدمين.
    // التحديث يتم بمطابقة الاسم: create أو update فقط.
    console.log("Seeding meals (upsert by name)...");

    // 1- Fetch all diseases to get their IDs
    const allDiseases = await prisma.chronicDiseases.findMany();
    const diseaseMap = {};
    allDiseases.forEach(d => {
        diseaseMap[d.name] = d.id;
    });

    for (const [time, meals] of Object.entries(mealCategories)) {
        for (const mealReq of meals) {
            const calories = kcalFromMacros(mealReq.proteins, mealReq.carbs, mealReq.fats);
            if (mealReq.calories !== calories) {
                console.warn(
                    `[seedMeals] "${mealReq.name}": calories في الملف=${mealReq.calories} ≠ من الماكروز=${calories} — يُحفظ ${calories}`
                );
            }
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
                        calories,
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
                console.log(`- Created: ${mealReq.name} (${time}) kcal=${calories}, ${connections.length} restrictions`);
            } else {
                const connections = mealReq.incompatibleDiseases
                    .filter(diseaseName => diseaseMap[diseaseName])
                    .map(diseaseName => ({
                        chronicDiseases: {
                            connect: { id: diseaseMap[diseaseName] }
                        }
                    }));

                await prisma.meal.update({
                    where: { id: existing.id },
                    data: {
                        name: mealReq.name,
                        calories,
                        portion: mealReq.portion,
                        proteins: mealReq.proteins,
                        fats: mealReq.fats,
                        carbs: mealReq.carbs,
                        ingredients: mealReq.ingredients,
                        imageUrl: mealReq.imageUrl,
                        time: time,
                        chromicDiseases: {
                            deleteMany: {},
                            create: connections
                        }
                    }
                });
                console.log(`- Updated meal: ${mealReq.name} kcal=${calories}`);
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
