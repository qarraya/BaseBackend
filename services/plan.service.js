import { calculateCalories, generateUserPlan } from "../utils/planGenerator.js";
import {
  FIRST_MONTH_FREE_MESSAGE_AR,
  SUBSCRIPTION_ACTIVE_PLAN_MESSAGE_AR,
} from "../constants/subscriptionMessages.js";
import { PLAN_GEN_REASON } from "../constants/subscriptionReasons.js";
import { HttpError } from "../errors/httpError.js";
import * as planRepo from "../repositories/plan.repository.js";
import * as subscriptionService from "./subscription.service.js";
import { ensureReservedPlanGeneration } from "./planEntitlement.service.js";

function buildEntitlementForPlanResponse(reserved, summary) {
  let messageAr = null;
  if (reserved.reason === PLAN_GEN_REASON.FREE_PLAN) {
    messageAr = FIRST_MONTH_FREE_MESSAGE_AR;
  } else if (reserved.reason === PLAN_GEN_REASON.SUBSCRIBED) {
    messageAr = SUBSCRIPTION_ACTIVE_PLAN_MESSAGE_AR;
  }

  return {
    accessGrantedVia: reserved.reason,
    hasActiveSubscription: summary?.hasActiveSubscription ?? false,
    subscriptionEndDate: summary?.subscriptionEndDate ?? null,
    freePlansRemaining: summary?.freePlansRemaining ?? 0,
    canGenerateAgain: summary?.canGenerateAgain ?? false,
    messageAr,
  };
}

/**
 * Shape API responses consistently (calories alias + lean meal list).
 */
export function mapPlanMealsForClient(plan) {
  const response = JSON.parse(JSON.stringify(plan));
  response.calories = plan.totalCalories;

  if (response.meals) {
    response.meals = response.meals.map((m) => ({
      id: m.id,
      mealId: m.meal?.id || m.mealId,
      name: m.meal?.name,
      calories: m.meal?.calories,
      imageUrl: m.meal?.imageUrl,
      time: m.meal?.time,
      dayNumber: m.dayNumber,
      multiplier: m.multiplier,
    }));
  }

  return response;
}

/**
 * Runs work after a successful reservation; refunds a free credit on any failure
 * (generator error, missing profile, DB read after create, etc.).
 */
async function runGenerationAfterReserve(userId, reserved, fn) {
  try {
    return await fn();
  } catch (err) {
    await subscriptionService.refundFreePlanCreditIfNeeded(userId, reserved.reason);
    throw err;
  }
}

/**
 * POST /generate-plan — new plan always goes through reservation + generator + load.
 * Returns `{ plan, entitlement }` so the client can show subscription vs free trial and remaining quota.
 */
export async function generatePlanForUser({ userId, startDate, endDate }) {
  const reserved = await ensureReservedPlanGeneration(userId);

  return runGenerationAfterReserve(userId, reserved, async () => {
    const plan = await generateUserPlan(userId, startDate, endDate);

    if (!plan) {
      throw new HttpError(
        400,
        "Failed to generate plan. Ensure profile exists and has weight/height."
      );
    }

    const completePlan = await planRepo.findPlanWithMealsById(plan.id);
    const planPayload = mapPlanMealsForClient(completePlan || plan);
    const summary = await subscriptionService.getUserEntitlementSummary(userId);

    return {
      plan: planPayload,
      entitlement: buildEntitlementForPlanResponse(reserved, summary),
    };
  });
}

/**
 * Create flow: may return an existing Plan row when calories still match (product logic).
 * That path does not consume subscription/free credits. New generation uses the same gate as above.
 */
export async function createPlanForUser({ userId, startDate, endDate }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingPlan = await planRepo.findActivePlanForUser(userId, today);

  if (existingPlan) {
    const profile = await planRepo.findProfileForCalorieCheck(userId);

    if (!profile || !profile.currentWeight || !profile.height) {
      throw new HttpError(
        400,
        "Profile is incomplete. Please complete profile data first."
      );
    }

    const expectedCalories = calculateCalories(
      profile.currentWeight,
      profile.height,
      profile.age || 25,
      profile.gender,
      profile.activityLevel,
      profile.goal
    );

    if (existingPlan.totalCalories === expectedCalories) {
      return mapPlanMealsForClient(existingPlan);
    }
  }

  const reserved = await ensureReservedPlanGeneration(userId);

  return runGenerationAfterReserve(userId, reserved, async () => {
    const plan = await generateUserPlan(userId, startDate, endDate);

    if (!plan) {
      throw new HttpError(
        400,
        "Failed to generate plan. Ensure profile exists and has weight/height."
      );
    }

    const completePlan = await planRepo.findPlanWithMealsById(plan.id);
    return mapPlanMealsForClient(completePlan || plan);
  });
}

/**
 * Latest plan; auto-generate when missing or calendar-expired (consumes entitlement when generating).
 * Response includes `planPageMessageAr` for the plan screen banner (“الشهر الأول مجاني” when trial applies).
 */
export async function getUserPlanOrGenerate(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let plan = await planRepo.findLatestPlanForUser(userId);

  const withPlanPageBanner = async (payload) => ({
    ...payload,
    planPageMessageAr: await subscriptionService.getPlanPageMessageArForUser(userId),
  });

  if (plan && new Date(plan.endDate) >= today) {
    return withPlanPageBanner(mapPlanMealsForClient(plan));
  }

  const reserved = await ensureReservedPlanGeneration(userId);

  return runGenerationAfterReserve(userId, reserved, async () => {
    await generateUserPlan(userId, new Date(), null);

    plan = await planRepo.findLatestPlanForUser(userId);

    if (!plan) {
      throw new HttpError(
        404,
        "No active plan found. Please verify your profile has weight and height."
      );
    }

    return withPlanPageBanner(mapPlanMealsForClient(plan));
  });
}
