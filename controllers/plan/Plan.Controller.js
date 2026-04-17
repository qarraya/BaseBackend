import { HttpError } from "../../errors/httpError.js";
import * as planRepo from "../../repositories/plan.repository.js";
import * as planService from "../../services/plan.service.js";

/**
 * Consistent JSON error shape for plan endpoints.
 */
function sendError(res, error) {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...error.extra,
    });
  }
  console.error("Plan controller error:", error);
  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
}

/**
 * POST /generate-plan — authenticated user; entitlement enforced in services.
 * Success body: `{ plan, entitlement }`.
 * Body `startDate` / `endDate`: meal-plan calendar only — not the billing subscription period.
 */
export const generatePlan = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        reason: "unauthorized",
      });
    }

    const payload = await planService.generatePlanForUser({
      userId,
      startDate,
      endDate,
    });

    return res.json(payload);
  } catch (error) {
    return sendError(res, error);
  }
};

export const createPlan = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.body;

    const payload = await planService.createPlanForUser({
      userId,
      startDate,
      endDate,
    });

    return res.json(payload);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getPlans = async (req, res) => {
  try {
    const plans = await planRepo.findAllPlansWithUser();
    const formattedPlans = plans.map((plan) => ({
      ...plan,
      calories: plan.totalCalories,
    }));
    return res.json(formattedPlans);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await planRepo.findPlanByIdWithUserAndMeals(id);

    if (!plan) {
      throw new HttpError(404, "Plan not found", { reason: "plan_not_found" });
    }

    return res.json(planService.mapPlanMealsForClient(plan));
  } catch (error) {
    return sendError(res, error);
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await planRepo.updatePlanById(id, req.body);
    return res.json(planService.mapPlanMealsForClient(plan));
  } catch (error) {
    return sendError(res, error);
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    await planRepo.deletePlanById(id);
    return res.json({ success: true, message: "Plan deleted successfully" });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getUserPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const payload = await planService.getUserPlanOrGenerate(userId);
    return res.json(payload);
  } catch (error) {
    return sendError(res, error);
  }
};
