import { PLAN_GEN_REASON } from "../constants/subscriptionReasons.js";
import { FREE_TRIAL_EXHAUSTED_MESSAGE_AR } from "../constants/subscriptionMessages.js";
import { HttpError } from "../errors/httpError.js";
import * as subscriptionService from "./subscription.service.js";

function subscriptionRequiredPayload(dynamicMessageAr = null) {
  return {
    reason: PLAN_GEN_REASON.SUBSCRIPTION_REQUIRED,
    requiresSubscription: true,
    messageAr: dynamicMessageAr || FREE_TRIAL_EXHAUSTED_MESSAGE_AR,
  };
}

/**
 * Central gate for “may this user cause a new plan to be generated?”
 *
 * 1) `canUserGeneratePlan` — read-only, same rules as production, no writes.
 * 2) `reservePlanGenerationEntitlement` — single transaction; either confirms subscription
 *    window or decrements `freePlansCount` once (safe under concurrency).
 *
 * Controllers and other services should use this instead of duplicating the two-step flow.
 */
export async function ensureReservedPlanGeneration(userId) {
  const preview = await subscriptionService.canUserGeneratePlan(userId);

  if (preview.userNotFound) {
    throw new HttpError(404, "User not found", { reason: "user_not_found" });
  }

  if (!preview.allowed) {
    throw new HttpError(403, "Subscription required", subscriptionRequiredPayload(preview.messageAr));
  }

  const reserved = await subscriptionService.reservePlanGenerationEntitlement(userId);

  if (reserved.userNotFound) {
    throw new HttpError(404, "User not found", { reason: "user_not_found" });
  }

  if (!reserved.allowed) {
    throw new HttpError(403, "Subscription required", subscriptionRequiredPayload(reserved.messageAr));
  }

  return reserved;
}
