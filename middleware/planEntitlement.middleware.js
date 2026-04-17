import * as subscriptionService from "../services/subscription.service.js";

/**
 * Optional: attach read-only eligibility to the request for dashboards or feature flags.
 * Does not reserve or decrement credits — use `ensureReservedPlanGeneration` in services for that.
 *
 * Sets `req.planGenerationEligibility` = `{ allowed, reason, userNotFound? }`.
 */
export async function attachPlanGenerationPreview(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        reason: "unauthorized",
      });
    }

    const eligibility = await subscriptionService.canUserGeneratePlan(userId);
    req.planGenerationEligibility = eligibility;
    next();
  } catch (err) {
    next(err);
  }
}
