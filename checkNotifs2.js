import prisma from "./lib/prisma.js";

async function checkCronNotifs() {
  try {
    const cronNotifs = await prisma.notification.findMany({
      where: {
        type: "REMINDER",
        title: {
          contains: "وقت"
        }
      },
      take: 5,
      orderBy: { createdAt: "desc" }
    });
    console.log("=== Meal Reminder (CRON) Notifications ===");
    console.log("Total found:", cronNotifs.length);
    for (const n of cronNotifs) {
      console.log(`- [${n.createdAt.toISOString()}] ${n.title}`);
    }

    const waterNotifs = await prisma.notification.findMany({
      where: { title: { contains: "ماء" } },
      take: 5,
      orderBy: { createdAt: "desc" }
    });
    console.log("\n=== Water Reminder (CRON) Notifications ===");
    console.log("Total found:", waterNotifs.length);
    for (const n of waterNotifs) {
      console.log(`- [${n.createdAt.toISOString()}] ${n.title}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}
checkCronNotifs();
