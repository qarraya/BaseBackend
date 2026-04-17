import { PrismaClient } from "@prisma/client";
import { PLAN_GEN_REASON } from "../constants/subscriptionReasons.js";

/** Single client for subscription persistence (same pattern as other modules). */
const prisma = new PrismaClient({ log: ["error"] });

/**
 * Columns required for entitlement only.
 * Access is NOT derived from the Plan table — only these User fields participate in the gate.
 * Note: `isSubscribed` is stored for billing/UI but is intentionally omitted here; validity uses
 * `subscriptionEndDate` alone (see subscription service).
 */
const entitlementSelect = {
  id: true,
  freePlansCount: true,
  subscriptionEndDate: true,
};

/**
 * Load only User columns needed for subscription / free-plan decisions (no joins).
 */
export async function findUserEntitlementById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: entitlementSelect,
  });
}

/**
 * Atomically either:
 * - Grants access on an unexpired subscription window (no freePlansCount change), or
 * - Decrements freePlansCount by 1 when the user relies on trial/gifted credits.
 *
 * Runs in a single DB transaction so two concurrent requests cannot decrement twice
 * from the same starting balance.
 */
export async function transactionallyReservePlanGeneration(userId) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: entitlementSelect,
    });

    if (!user) {
      return { ok: false, userExists: false, reason: null };
    }

    const now = new Date();

    // Paid/granted window: active iff end date is strictly in the future.
    if (user.subscriptionEndDate && user.subscriptionEndDate > now) {
      return { ok: true, userExists: true, reason: PLAN_GEN_REASON.SUBSCRIBED };
    }

    if (user.freePlansCount > 0) {
      await tx.user.update({
        where: { id: userId },
        data: { freePlansCount: { decrement: 1 } },
      });
      return { ok: true, userExists: true, reason: PLAN_GEN_REASON.FREE_PLAN };
    }

    return {
      ok: false,
      userExists: true,
      reason: PLAN_GEN_REASON.SUBSCRIPTION_REQUIRED,
    };
  });
}

/**
 * Restore one free plan credit (e.g. generation failed after decrement).
 */
export async function incrementFreePlansCount(userId, by = 1) {
  await prisma.user.update({
    where: { id: userId },
    data: { freePlansCount: { increment: by } },
  });
}

/**
 * Persist subscription window and billing flag after payment or admin grant.
 * Entitlement checks ignore `isSubscribed` and rely only on `subscriptionEndDate`.
 */
export async function setActiveSubscription(userId, subscriptionEndDate, isSubscribed = true) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isSubscribed,
      subscriptionEndDate,
    },
  });
}

/** End subscription window (does not change freePlansCount). */
export async function clearSubscriptionWindow(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isSubscribed: false,
      subscriptionEndDate: null,
    },
  });
}

/** UI / “my subscription” screen — not used for entitlement gates. */
export async function findUserSubscriptionDisplay(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSubscribed: true,
      subscriptionEndDate: true,
      freePlansCount: true,
    },
  });
}
