import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error"],
});
const calculateCalories = (weight, height, age, gender, activityLevel, goal) => {
  let bmr;

  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultipliers = {
    low: 1.2,
    medium: 1.55,
    high: 1.9,
  };

  let calories = bmr * (activityMultipliers[activityLevel] || 1.2);

  if (goal === "lose") calories -= 500;
  if (goal === "gain") calories += 500;

  return Math.round(calories);
};
// ➕ Create Plan (السعرات تحسب تلقائياً)
export const createPlan = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.body;

    // جلب بيانات المستخدم
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const age = 25; // العمر افتراضي لو مش مخزن
    const totalCalories = calculateCalories(
      user.currentWeight,
      user.height,
      age,
      user.gender,
      user.activityLevel,
      user.goal
    );

    const plan = await prisma.plan.create({
      data: {
        totalCalories,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId
      }
    });

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
      include: { user: true, meals: true }
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