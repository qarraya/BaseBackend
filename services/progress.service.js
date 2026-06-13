import prisma from "../lib/prisma.js";

/**
 * Signed delta: positive if weight went up, negative if down.
 */
export function computeWeightDelta(newWeight, previousWeight) {
  return Number(newWeight) - Number(previousWeight);
}

/**
 * Persist a progress row (called when weight or body fat is set or changes on the profile).
 */
export async function recordProgressSnapshot(userId, { newWeight, previousWeight, newBodyFat, previousBodyFat }) {
  const nw = Number(newWeight);
  const pw = Number(previousWeight);

  if (Number.isNaN(nw) || Number.isNaN(pw)) {
    throw new Error("newWeight and previousWeight must be valid numbers");
  }

  return prisma.progress.create({
    data: {
      userId,
      newWeight: nw,
      previousWeight: pw,
      newBodyFat: newBodyFat ? Number(newBodyFat) : undefined,
      previousBodyFat: previousBodyFat ? Number(previousBodyFat) : undefined,
    },
  });
}

/**
 * Migration helper / Legacy support for old calls
 */
export async function recordWeightSnapshot(userId, newWeight, previousWeight) {
  return recordProgressSnapshot(userId, { newWeight, previousWeight });
}

/**
 * History for charts / list; each item includes `weightChange` vs the stored previousWeight.
 */
export async function getUserProgressHistory(userId, options = {}) {
  const order = options.order === "asc" ? "asc" : "desc";

  const rows = await prisma.progress.findMany({
    where: { userId },
    orderBy: { date: order },
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    date: row.date,
    newWeight: row.newWeight,
    previousWeight: row.previousWeight,
    weightChange: computeWeightDelta(row.newWeight, row.previousWeight),
    newBodyFat: row.newBodyFat,
    previousBodyFat: row.previousBodyFat,
    bodyFatChange: row.newBodyFat && row.previousBodyFat ? Number((row.newBodyFat - row.previousBodyFat).toFixed(1)) : 0
  }));
}
