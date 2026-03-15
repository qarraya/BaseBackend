import { PrismaClient } from "@prisma/client";
import { generateUserPlan } from "../../utils/planGenerator.js";

const prisma = new PrismaClient({
  log: ["error"],
});

// ➕ Create Plan (السعرات تحسب تلقائياً)
export const createPlan = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.body;

    const plan = await generateUserPlan(userId, startDate, endDate);

    if (!plan) {
      return res.status(400).json({ error: "Failed to generate plan. Ensure profile exists and has weight/height." });
    }

    const response = JSON.parse(JSON.stringify(plan));
    response.calories = plan.totalCalories;
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

// 📥 Get Latest Plan for a Specific User
export const getUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const plan = await prisma.plan.findFirst({
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

    if (!plan) {
      return res.status(404).json({ message: "No plan found for this user." });
    }

    const response = JSON.parse(JSON.stringify(plan));
        response.calories = plan.totalCalories;
        res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};