import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

/**
 * @param {{ userId: string; newWeight: number; previousWeight: number; date?: Date }} data
 */
export async function insertProgress(data) {
  return prisma.progress.create({
    data: {
      userId: data.userId,
      newWeight: data.newWeight,
      previousWeight: data.previousWeight,
      ...(data.date ? { date: data.date } : {}),
    },
  });
}

/**
 * @param {"asc" | "desc"} sortDirection - `desc` = newest first
 */
export async function findProgressByUserId(userId, sortDirection = "desc") {
  return prisma.progress.findMany({
    where: { userId },
    orderBy: { date: sortDirection },
  });
}
