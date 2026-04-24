import prisma from "../lib/prisma.js";

async function checkNotifications() {
  try {
    console.log("==========================================");
    console.log("       NOTIFICATIONS HEALTH CHECK");
    console.log("==========================================\n");

    const users = await prisma.user.findMany({
      include: { profile: true }
    });
    
    let noNotifsUsers = [];
    let recentNotifsUsers = [];
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3); // Check last 3 days
    
    for (const u of users) {
      const notifs = await prisma.notification.findMany({
        where: { userId: u.id },
        orderBy: { createdAt: "desc" },
        take: 1
      });
      
      const hasProfile = !!u.profile;
      
      if (notifs.length === 0 || notifs[0].createdAt < recentDate) {
         noNotifsUsers.push({ username: u.username, hasProfile });
      } else {
         recentNotifsUsers.push({ username: u.username, latest: notifs[0].createdAt });
      }
    }
    
    console.log(`✅ Users receiving notifications: ${recentNotifsUsers.length}`);
    console.log(`❌ Users missing notifications: ${noNotifsUsers.length}\n`);

    if (noNotifsUsers.length > 0) {
      console.log("--- USERS MISSING NOTIFICATIONS ---");
      noNotifsUsers.forEach(u => {
        console.log(`- ${u.username} | Has Profile: ${u.hasProfile ? 'Yes' : 'NO (This is why!)'}`);
      });
      console.log("\n💡 Note: Meal reminders automatically SKIP users with no profile.");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();
