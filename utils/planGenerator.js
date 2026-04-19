import prisma from "../lib/prisma.js";

const hashString = (value = "") => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pickMealForDay = (meals, dayIndex, goal, userId, mealTime) => {
  if (!meals.length) return null;

  const sortedMeals = [...meals].sort((a, b) => a.calories - b.calories);
  const lowerHalf = sortedMeals.slice(0, Math.ceil(sortedMeals.length / 2));
  const upperHalf = sortedMeals.slice(Math.floor(sortedMeals.length / 2));

  let pool = sortedMeals;
  const normalizedGoal = String(goal || "").toUpperCase();
  if (normalizedGoal === "LOSE" && lowerHalf.length) {
    pool = lowerHalf;
  } else if (normalizedGoal === "GAIN" && upperHalf.length) {
    pool = upperHalf;
  }

  // User-specific deterministic order; different users get different goal plans.
  const orderedPool = [...pool].sort((a, b) => {
    const aScore = hashString(`${userId}:${mealTime}:${normalizedGoal}:${a.id}`);
    const bScore = hashString(`${userId}:${mealTime}:${normalizedGoal}:${b.id}`);
    if (aScore === bScore) return a.id.localeCompare(b.id);
    return aScore - bScore;
  });

  const rotation = hashString(`${userId}:${mealTime}:${normalizedGoal}`) % orderedPool.length;
  const index = (rotation + dayIndex - 1) % orderedPool.length;
  return orderedPool[index];
};

/**
 * Calculates daily calorie needs based on user profile.
 */
export const calculateCalories = (weight, height, age, gender, activityLevel, goal) => {
  let bmr;

  const g = String(gender).toUpperCase();
  const a = String(activityLevel).toUpperCase();
  const gl = String(goal).toUpperCase();

  if (g === "MALE") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultipliers = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725,
    VERY_ACTIVE: 1.9,
  };

  const maintenanceCalories = bmr * (activityMultipliers[a] || 1.2);

  let calories = maintenanceCalories;

  if (gl === "LOSE") calories = maintenanceCalories - 500;
  else if (gl === "GAIN") calories = maintenanceCalories + 500;

  return Math.round(calories);
};

/**
 * Generates a meal plan for a user automatically.
 * Defaults to a 7-day plan starting today.
 */
export const generateUserPlan = async (userId, startDate = new Date(), endDate = null) => {
  try {
    // 1. Fetch user profile with chronic diseases
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            chronicDiseases: true
          }
        }
      }
    });

    if (!user || !user.profile) {
      console.warn(`Cannot generate plan for user ${userId}: Profile not found.`);
      return null;
    }

    const { profile } = user;
    const age = profile.age || 25;

    if (!profile.currentWeight || !profile.height) {
      console.warn(`Cannot generate plan for user ${userId}: Missing weight or height.`);
      return null;
    }

    // 2. Calculate calories
    const totalCalories = calculateCalories(
      profile.currentWeight,
      profile.height,
      age,
      profile.gender,
      profile.activityLevel,
      profile.goal
    );

    // 3. Set dates (default 7 days if not provided)
    const sDate = new Date(startDate);
    const eDate = endDate ? new Date(endDate) : new Date(sDate.getTime() + 6 * 24 * 60 * 60 * 1000);

    sDate.setHours(0, 0, 0, 0);
    eDate.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(eDate - sDate);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // 4. Create Plan
    const plan = await prisma.plan.create({
      data: {
        totalCalories,
        startDate: sDate,
        endDate: eDate,
        userId
      }
    });

    // 5. Fetch and Filter Meals
    const userChronicDiseasesIds = profile.chronicDiseases.map(cd => cd.chronicDiseaseId);
    const allMeals = await prisma.meal.findMany({
      include: {
        chromicDiseases: true
      }
    });

    const allowedMeals = allMeals.filter(meal => {
      const isForbidden = meal.chromicDiseases.some(md => userChronicDiseasesIds.includes(md.chronicDiseasesId));
      return !isForbidden;
    });

    const breakfasts = allowedMeals.filter(m => m.time === "BREAKFAST");
    const lunches = allowedMeals.filter(m => m.time === "LUNCH");
    const dinners = allowedMeals.filter(m => m.time === "DINNER");
    const snacks = allowedMeals.filter(m => m.time === "SNACK");

    // 6. Generate Plan Meals
    if (breakfasts.length > 0 && lunches.length > 0 && dinners.length > 0 && snacks.length > 0) {
      const planMealsData = [];

      for (let day = 1; day <= totalDays; day++) {
        const bMeal = pickMealForDay(breakfasts, day, profile.goal, userId, "BREAKFAST");
        const lMeal = pickMealForDay(lunches, day, profile.goal, userId, "LUNCH");
        const dMeal = pickMealForDay(dinners, day, profile.goal, userId, "DINNER");
        const sMeal = pickMealForDay(snacks, day, profile.goal, userId, "SNACK");

        if (!bMeal || !lMeal || !dMeal || !sMeal) continue;

        const baseDailyCalories = bMeal.calories + lMeal.calories + dMeal.calories + sMeal.calories;
        let multiplier = 1.0;
        if (baseDailyCalories > 0) {
          multiplier = parseFloat((totalCalories / baseDailyCalories).toFixed(2));
        }

        planMealsData.push({ planId: plan.id, mealId: bMeal.id, dayNumber: day, mealTime: "BREAKFAST", multiplier });
        planMealsData.push({ planId: plan.id, mealId: lMeal.id, dayNumber: day, mealTime: "LUNCH", multiplier });
        planMealsData.push({ planId: plan.id, mealId: dMeal.id, dayNumber: day, mealTime: "DINNER", multiplier });
        planMealsData.push({ planId: plan.id, mealId: sMeal.id, dayNumber: day, mealTime: "SNACK", multiplier });
      }

      await prisma.planMeal.createMany({
        data: planMealsData
      });
    }

    return plan;
  } catch (error) {
    console.error(`Error in generateUserPlan for user ${userId}:`, error);
    throw error;
  }
};