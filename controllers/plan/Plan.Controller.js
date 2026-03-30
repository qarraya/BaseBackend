import { PrismaClient } from "@prisma/client";
import { generateUserPlan } from "../../utils/planGenerator.js";

const prisma = new PrismaClient({
  log: ["error"],
});

// ➕ Create Plan (السعرات تحسب تلقائياً)
export const createPlan = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.body;

    // Check if an active plan already exists (endDate >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingPlan = await prisma.plan.findFirst({
      where: {
        userId,
        endDate: { gte: today }
      },
      orderBy: { createdAt: "desc" },
      include: {
        meals: {
          include: { meal: true }
        }
      }
    });

    if (existingPlan) {
      const response = JSON.parse(JSON.stringify(existingPlan));
      response.calories = existingPlan.totalCalories;
      return res.json(response);
    }

    const plan = await generateUserPlan(userId, startDate, endDate);

    if (!plan) {
      return res.status(400).json({ error: "Failed to generate plan. Ensure profile exists and has weight/height." });
    }

    // Fetch the newly generated plan mapped completely
    const completePlan = await prisma.plan.findUnique({
      where: { id: plan.id },
      include: {
        meals: {
          include: { meal: true }
        }
      }
    });

    const response = JSON.parse(JSON.stringify(completePlan || plan));
    response.calories = plan.totalCalories;
    
    // Flatten meals: spread meal details directly into the meal object in the plan
    if (response.meals) {
      response.meals = response.meals.map(m => ({
        ...m,
        ...(m.meal || {})
      }));
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📥 Get All Plans
export const getPlans = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({ include: { user: true } });
    const formattedPlans = plans.map(plan => ({
      ...plan,
      calories: plan.totalCalories
    }));
    res.json(formattedPlans);
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
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    const response = JSON.parse(JSON.stringify(plan));
    response.calories = plan.totalCalories;

    // Flatten meals
    if (response.meals) {
      response.meals = response.meals.map(m => ({
        ...m,
        ...(m.meal || {})
      }));
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✏️ Update Plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await prisma.plan.update({ where: { id }, data: req.body });
    const response = JSON.parse(JSON.stringify(plan));
        response.calories = plan.totalCalories;
        res.json(response);
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

// 📥 Get Latest / Active Plan for a Specific User
export const getUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    let plan = await prisma.plan.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        meals: {
          include: {
            meal: true
          }
        }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If no plan exists or the latest plan is expired, generate a new one
    if (!plan || new Date(plan.endDate) < today) {
      const newPlan = await generateUserPlan(userId);
      if (newPlan) {
        // Fetch the newly generated plan completely
        plan = await prisma.plan.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          include: {
            meals: {
              include: { meal: true }
            }
          }
        });
      }
    }

    if (!plan) {
      return res.status(404).json({ message: "No active plan found. Please verify your profile has weight and height." });
    }

    const response = JSON.parse(JSON.stringify(plan));
    response.calories = plan.totalCalories;

    // Flatten meals: so the "front-end" can easily click and access portion, protein, etc.
    if (response.meals) {
      response.meals = response.meals.map(m => ({
        ...m,
        ...(m.meal || {})
      }));
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};