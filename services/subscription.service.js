import prisma from "../lib/prisma.js";
import { PLAN_GEN_REASON } from "../constants/subscriptionReasons.js";
import {
  FIRST_MONTH_FREE_MESSAGE_AR,
  SUBSCRIPTION_EXPIRED_MESSAGE_AR,
  FREE_TRIAL_EXHAUSTED_MESSAGE_AR,
} from "../constants/subscriptionMessages.js";

/**
 * Columns required for entitlement only.
 */
const entitlementSelect = {
  id: true,
  freePlansCount: true,
  subscriptionEndDate: true,
  createdAt: true,
};

/**
 * Whether the user currently has an unexpired subscription *window*.
 * Source of truth: subscriptionEndDate > now only.
 * If `isSubscribed` is true but the end date is in the past, this returns false.
 */
export function hasActiveSubscriptionWindow(user) {
  if (!user?.subscriptionEndDate) return false;
  return user.subscriptionEndDate > new Date();
}

/**
 * Whether the user is within their first 30 days of account creation.
 */
export function isInTrialPeriod(user) {
  if (!user?.createdAt) return false;
  const trialDurationDays = 30;
  const trialEndDate = new Date(user.createdAt);
  trialEndDate.setDate(trialEndDate.getDate() + trialDurationDays);
  return new Date() < trialEndDate;
}

/**
 * Pure eligibility from a User entitlement row (no Plan table, no extra queries).
 * Order: (1) valid subscription window, (2) free credits, (3) deny.
 */
export function evaluatePlanGenerationFromUserRow(user) {
  if (!user) {
    return {
      allowed: false,
      reason: PLAN_GEN_REASON.SUBSCRIPTION_REQUIRED,
      userNotFound: true,
      messageAr: FREE_TRIAL_EXHAUSTED_MESSAGE_AR,
    };
  }
  if (hasActiveSubscriptionWindow(user)) {
    return { allowed: true, reason: PLAN_GEN_REASON.SUBSCRIBED };
  }
  if (isInTrialPeriod(user)) {
    return { allowed: true, reason: PLAN_GEN_REASON.TRIAL };
  }
  if (user.freePlansCount > 0) {
    return { allowed: true, reason: PLAN_GEN_REASON.FREE_PLAN };
  }
  return { 
    allowed: false, 
    reason: PLAN_GEN_REASON.SUBSCRIPTION_REQUIRED,
    messageAr: user.subscriptionEndDate ? SUBSCRIPTION_EXPIRED_MESSAGE_AR : FREE_TRIAL_EXHAUSTED_MESSAGE_AR
  };
}

/**
 * Read-only gate for UI or diagnostics (does not decrement freePlansCount).
 */
export async function canUserGeneratePlan(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: entitlementSelect,
  });
  return evaluatePlanGenerationFromUserRow(user);
}

/**
 * Snapshot of User entitlement after an operation (for API responses / UI).
 * Values reflect current DB state (e.g. freePlansRemaining after a decrement).
 */
export async function getUserEntitlementSummary(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: entitlementSelect,
  });
  if (!user) return null;

  const hasActiveSubscription = hasActiveSubscriptionWindow(user);
  const inTrial = isInTrialPeriod(user);
  const freePlansRemaining = user.freePlansCount;

  return {
    hasActiveSubscription,
    subscriptionEndDate: user.subscriptionEndDate,
    freePlansRemaining,
    inTrial,
    trialStartDate: user.createdAt,
    /** Whether another generate would pass the gate right now (subscription window, trial, or credits). */
    canGenerateAgain: hasActiveSubscription || inTrial || freePlansRemaining > 0,
  };
}

/**
 * Atomic reservation: confirms subscription window or consumes exactly one free credit.
 */
export async function reservePlanGenerationEntitlement(userId) {
  const res = await prisma.$transaction(async (tx) => {
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

    if (isInTrialPeriod(user)) {
      return { ok: true, userExists: true, reason: PLAN_GEN_REASON.TRIAL };
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

  if (!res.userExists) {
    return {
      allowed: false,
      reason: PLAN_GEN_REASON.SUBSCRIPTION_REQUIRED,
      userNotFound: true,
      messageAr: FREE_TRIAL_EXHAUSTED_MESSAGE_AR,
    };
  }

  if (!res.ok) {
    return { allowed: false, reason: res.reason };
  }

  return { allowed: true, reason: res.reason };
}

/**
 * Roll back one free credit if generation failed after a free_plan reservation.
 * No-op for subscribed path (reservedReason !== free_plan).
 */
export async function refundFreePlanCreditIfNeeded(userId, reservedReason) {
  if (reservedReason === PLAN_GEN_REASON.FREE_PLAN) {
    await prisma.user.update({
      where: { id: userId },
      data: { freePlansCount: { increment: 1 } },
    });
  }
}

/**
 * Start or renew subscription from today for N days (e.g. payment webhook).
 * Sets `isSubscribed` for product semantics; runtime access still uses `subscriptionEndDate` only.
 */
export async function activateUserSubscription(userId, durationDays = 30) {
  const days = Math.max(1, Number(durationDays) || 30);
  const subscriptionEndDate = new Date();
  subscriptionEndDate.setDate(subscriptionEndDate.getDate() + days);

  await prisma.user.update({
    where: { id: userId },
    data: {
      isSubscribed: true,
      subscriptionEndDate,
    },
  });

  return { isSubscribed: true, subscriptionEndDate };
}

/**
 * Cancel / clear paid window (e.g. dev reset after testing activate).
 * Trial balance `freePlansCount` is left unchanged.
 */
export async function cancelUserSubscription(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isSubscribed: false,
      subscriptionEndDate: null,
    },
  });
  return { isSubscribed: false, subscriptionEndDate: null };
}

/** Admin/promo: add complimentary generations without touching Plan rows. */
export async function giftFreePlanCredits(userId, count = 1) {
  const n = Math.max(1, Number(count) || 1);
  await prisma.user.update({
    where: { id: userId },
    data: { freePlansCount: { increment: n } },
  });
  return { added: n };
}

/**
 * Combined snapshot for GET /api/subscription/me (dev + app profile).
 */
export async function getSubscriptionStatusForClient(userId) {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isSubscribed: true,
      subscriptionEndDate: true,
      freePlansCount: true,
      createdAt: true,
    },
  });
  if (!row) return null;

  const now = new Date();
  const hasActiveSubscription = hasActiveSubscriptionWindow(row);
  const inTrial = isInTrialPeriod(row);
  const freePlansRemaining = row.freePlansCount;
  const canGenerateAgain = hasActiveSubscription || inTrial || freePlansRemaining > 0;

  /** Had an end date set and it is no longer in the future (subscription “period” over). */
  const subscriptionWindowExpired =
    row.subscriptionEndDate != null && row.subscriptionEndDate <= now;

  /** Cannot call generate-plan without paying / renewing / receiving credits. */
  const needsSubscriptionToGenerate = !canGenerateAgain;

  /** Banner for plan screen: first month free while user still has trial credit and no active sub. */
  const planPageMessageAr =
    !hasActiveSubscription && (inTrial || freePlansRemaining > 0) ? FIRST_MONTH_FREE_MESSAGE_AR : null;

  const trialEndDate = new Date(row.createdAt);
  trialEndDate.setDate(trialEndDate.getDate() + 30);

  return {
    isSubscribed: row.isSubscribed,
    subscriptionEndDate: row.subscriptionEndDate,
    freePlansRemaining,
    hasActiveSubscription,
    inTrial,
    trialStartDate: row.createdAt,
    trialEndDate: trialEndDate,
    subscriptionWindowExpired,
    canGenerateAgain,
    needsSubscriptionToGenerate,
    messageAr: needsSubscriptionToGenerate 
      ? (row.subscriptionEndDate ? SUBSCRIPTION_EXPIRED_MESSAGE_AR : FREE_TRIAL_EXHAUSTED_MESSAGE_AR) 
      : null,
    planPageMessageAr,
  };
}

/**
 * Same copy as `planPageMessageAr` from GET /subscription/me — for attaching to plan payloads.
 */
export async function getPlanPageMessageArForUser(userId) {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionEndDate: true,
      freePlansCount: true,
      createdAt: true,
    },
  });
  if (!row) return null;
  if (hasActiveSubscriptionWindow(row)) return null;
  if (isInTrialPeriod(row) || row.freePlansCount > 0) return FIRST_MONTH_FREE_MESSAGE_AR;
  return null;
}
