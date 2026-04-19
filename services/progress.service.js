import prisma from "../lib/prisma.js";

/**
 * Signed delta: positive if weight went up, negative if down.
 */
export function computeWeightDelta(newWeight, previousWeight) {
  return Number(newWeight) - Number(previousWeight);
}

/**
 * Persist a progress row (called when weight is set or changes on the profile).
 */
export async function recordWeightSnapshot(userId, newWeight, previousWeight) {
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
    },
  });
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
  }));
}
