import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const genders = ['MALE', 'FEMALE'];
  const activityLevels = ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'];
  const goals = ['LOSE', 'MAINTAIN', 'GAIN'];

  console.log('--- البدء في تغذية قواعد الحساب الغذائي ---');

  for (const gender of genders) {
    for (const activity of activityLevels) {
      for (const goal of goals) {
        // حساب قيم افتراضية معقولة (كقاعدة أساسية فقط)
        let calories = 2000;
        
        // تعديل السعرات حسب الجنس
        if (gender === 'FEMALE') calories -= 300;
        
        // تعديل السعرات حسب النشاط
        if (activity === 'SEDENTARY') calories -= 200;
        if (activity === 'ACTIVE') calories += 300;
        if (activity === 'VERY_ACTIVE') calories += 500;
        
        // تعديل السعرات حسب الهدف
        if (goal === 'LOSE') calories -= 400;
        if (goal === 'GAIN') calories += 400;

        // حساب الماكروز (نسب تقريبية 40% كربوهيدرات، 30% بروتين، 30% دهون)
        const proteins = (calories * 0.3) / 4;
        const fats = (calories * 0.3) / 9;
        const carbs = (calories * 0.4) / 4;

        await prisma.nutritionalRule.upsert({
          where: {
            gender_activityLevel_goal: {
              gender: gender,
              activityLevel: activity,
              goal: goal,
            },
          },
          update: {}, // لا تغير شيئاً إذا كانت موجودة مسبقاً (لحماية بياناتك القديمة)
          create: {
            gender: gender,
            activityLevel: activity,
            goal: goal,
            calories: Math.round(calories),
            proteins: Math.round(proteins * 10) / 10,
            fats: Math.round(fats * 10) / 10,
            carbs: Math.round(carbs * 10) / 10,
          },
        });
      }
    }
  }

  console.log('--- تمت عملية التغذية بنجاح لـ 30 حالة مختلفة! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
