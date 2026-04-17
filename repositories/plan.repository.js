import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

const mealsWithMealInclude = {
  meals: {
    include: { meal: true },
  },
};

/**
 * Latest plan that is still active on or after startOfToday (local day boundary handled by caller).
 */
export async function findActivePlanForUser(userId, startOfToday) {
  return prisma.plan.findFirst({
    where: {
      userId,
      endDate: { gte: startOfToday },
    },
    orderBy: { createdAt: "desc" },
    include: mealsWithMealInclude,
  });
}

export async function findProfileForCalorieCheck(userId) {
  return prisma.profile.findUnique({
    where: { userId },
    include: { chronicDiseases: true },
  });
}

export async function findPlanWithMealsById(planId) {
  return prisma.plan.findUnique({
    where: { id: planId },
    include: mealsWithMealInclude,
  });
}

export async function findLatestPlanForUser(userId) {
  return prisma.plan.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: mealsWithMealInclude,
  });
}

export async function findAllPlansWithUser() {
  return prisma.plan.findMany({ include: { user: true } });
}

export async function findPlanByIdWithUserAndMeals(id) {
  return prisma.plan.findUnique({
    where: { id },
    include: {
      user: true,
      meals: { include: { meal: true } },
    },
  });
}

export async function updatePlanById(id, data) {
  return prisma.plan.update({ where: { id }, data });
}

export async function deletePlanById(id) {
  return prisma.plan.delete({ where: { id } });
}
