import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error"],
});
const calculateCalories = (weight, height, age, gender, activityLevel, goal) => {
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

  let calories = bmr * (activityMultipliers[a] || 1.2);

  if (gl === "LOSE") calories -= 500;
  if (gl === "GAIN") calories += 500;

  return Math.round(calories);
};

// ➕ Create Plan (السعرات تحسب تلقائياً)
export const createPlan = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.body;

    // جلب بيانات المستخدم مع الملف الشخصي لحساب السعرات
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

    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.profile) return res.status(400).json({ error: "Profile not found for this user. Create profile first." });

    const profile = user.profile;
    const age = profile.age || 25; // العمر افتراضي لو مش مخزن

    // تأكد من وجود الوزن والطول
    if (!profile.currentWeight || !profile.height) {
      return res.status(400).json({ error: "Weight and height are required in profile to calculate calories." });
    }

    const totalCalories = calculateCalories(
      profile.currentWeight,
      profile.height,
      age,
      profile.gender,
      profile.activityLevel,
      profile.goal
    );

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    // التأكد من صحة التواريخ
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format for startDate or endDate. Make sure to use proper format (e.g. YYYY-MM-DD)." });
    }

    const plan = await prisma.plan.create({
      data: {
        totalCalories,
        startDate: sDate,
        endDate: eDate,
        userId
      }
    });

    // --- توليد وجبات الخطة تلقائياً ---
    // حساب عدد الأيام
    sDate.setHours(0, 0, 0, 0);
    eDate.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(eDate - sDate);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // استخراج الأمراض التي يعاني منها المستخدم (array of IDs)
    const userChronicDiseasesIds = profile.chronicDiseases.map(cd => cd.chronicDiseaseId);

    // جلب كل الوجبات المتاحة في قاعدة البيانات مع الأمراض الممنوعة عنها
    const allMeals = await prisma.meal.findMany({
      include: {
        chromicDiseases: true
      }
    });

    // فلترة الوجبات لاستبعاد أي وجبة تحتوي على مرض من أمراض المستخدم
    const allowedMeals = allMeals.filter(meal => {
      // هل الوجبة تمتلك أي مرض يتطابق مع أمراض المستخدم؟
      const isForbidden = meal.chromicDiseases.some(md => userChronicDiseasesIds.includes(md.chronicDiseasesId));
      return !isForbidden;
    });

    // تقسيم الوجبات المسموحة حسب نوعها
    const breakfasts = allowedMeals.filter(m => m.time === "BREAKFAST");
    const lunches = allowedMeals.filter(m => m.time === "LUNCH");
    const dinners = allowedMeals.filter(m => m.time === "DINNER");
    const snacks = allowedMeals.filter(m => m.time === "SNACK");

    // نقتصر التوليد على وجود وجبات على الأقل في قاعدة البيانات
    if (breakfasts.length > 0 && lunches.length > 0 && dinners.length > 0 && snacks.length > 0) {
      const planMealsData = [];

      for (let day = 1; day <= totalDays; day++) {
        // نختار وجبة بشكل متسلسل (أو عشوائي) بناءً على رقم اليوم
        const bMeal = breakfasts[(day - 1) % breakfasts.length];
        const lMeal = lunches[(day - 1) % lunches.length];
        const dMeal = dinners[(day - 1) % dinners.length];
        const sMeal = snacks[(day - 1) % snacks.length];

        planMealsData.push({ planId: plan.id, mealId: bMeal.id, dayNumber: day, mealTime: "BREAKFAST" });
        planMealsData.push({ planId: plan.id, mealId: lMeal.id, dayNumber: day, mealTime: "LUNCH" });
        planMealsData.push({ planId: plan.id, mealId: dMeal.id, dayNumber: day, mealTime: "DINNER" });
        planMealsData.push({ planId: plan.id, mealId: sMeal.id, dayNumber: day, mealTime: "SNACK" });
      }

      await prisma.planMeal.createMany({
        data: planMealsData
      });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📥 Get All Plans
export const getPlans = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({ include: { user: true } });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📥 Get Plan By ID
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        user: true,
        meals: {
          include: {
            meal: true // This guarantees we get the specific meal details (name, cal, image, etc.)
          }
        }
      }
    });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✏️ Update Plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await prisma.plan.update({ where: { id }, data: req.body });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ❌ Delete Plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.plan.delete({ where: { id } });
    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};