import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rules = [
    // --- MALE ---
    // LOSE
    { gender: "MALE", activityLevel: "MODERATE", goal: "LOSE", calories: 2000, proteins: 150, fats: 65, carbs: 200 },
    { gender: "MALE", activityLevel: "ACTIVE", goal: "LOSE", calories: 2400, proteins: 180, fats: 75, carbs: 250 },
    // MAINTAIN
    { gender: "MALE", activityLevel: "MODERATE", goal: "MAINTAIN", calories: 2500, proteins: 140, fats: 80, carbs: 300 },
    { gender: "MALE", activityLevel: "ACTIVE", goal: "MAINTAIN", calories: 3000, proteins: 160, fats: 90, carbs: 380 },
    // GAIN
    { gender: "MALE", activityLevel: "MODERATE", goal: "GAIN", calories: 3000, proteins: 160, fats: 85, carbs: 400 },
    { gender: "MALE", activityLevel: "ACTIVE", goal: "GAIN", calories: 3500, proteins: 180, fats: 100, carbs: 470 },

    // --- FEMALE ---
    // LOSE
    { gender: "FEMALE", activityLevel: "MODERATE", goal: "LOSE", calories: 1500, proteins: 110, fats: 50, carbs: 150 },
    { gender: "FEMALE", activityLevel: "ACTIVE", goal: "LOSE", calories: 1800, proteins: 130, fats: 60, carbs: 180 },
    // MAINTAIN
    { gender: "FEMALE", activityLevel: "MODERATE", goal: "MAINTAIN", calories: 1800, proteins: 100, fats: 60, carbs: 215 },
    { gender: "FEMALE", activityLevel: "ACTIVE", goal: "MAINTAIN", calories: 2200, proteins: 120, fats: 70, carbs: 270 },
    // GAIN
    { gender: "FEMALE", activityLevel: "MODERATE", goal: "GAIN", calories: 2300, proteins: 120, fats: 75, carbs: 285 },
    { gender: "FEMALE", activityLevel: "ACTIVE", goal: "GAIN", calories: 2700, proteins: 140, fats: 85, carbs: 345 },
  ];

  console.log("Seeding nutritional rules...");

  for (const rule of rules) {
    await prisma.nutritionalRule.upsert({
      where: {
        gender_activityLevel_goal: {
          gender: rule.gender,
          activityLevel: rule.activityLevel,
          goal: rule.goal,
        },
      },
      update: rule,
      create: rule,
    });
  }

  console.log("Nutritional rules seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
