import cron from "node-cron";
import prisma from "../lib/prisma.js";
import { createSystemNotification } from "../utils/notificationService.js";

const sendMealReminder = async (title, baseMessage, mealTime) => {
    try {
        console.log(`Running ${mealTime} Reminder Cron Job...`);
        const users = await prisma.user.findMany({
            include: {
                profile: {
                    include: {
                        chronicDiseases: {
                            include: { chronicDisease: true }
                        }
                    }
                }
            }
        });

        for (const user of users) {
            if (!user.profile) continue;

            let extraAdvice = "";
            const diseases = user.profile.chronicDiseases.map(cd => cd.chronicDisease.name);

            // Get a friendly meal name for the advice
            const mealNameInArabic = title.includes("فطور") ? "وجبة الفطور" :
                title.includes("غداء") ? "وجبة الغداء" :
                    title.includes("عشاء") ? "وجبة العشاء" :
                        title.includes("سناك") ? "وجبة السناك" : "هذه الوجبة";

            // Check for Diabetes
            if (diseases.some(d => d.includes("سكري") || d.toLowerCase().includes("diabet"))) {
                extraAdvice += ` ⚠️ (تنبيه: قلل من السكريات في ${mealNameInArabic} هذه).`;
            }
            // Check for Blood Pressure / Heart
            if (diseases.some(d => d.includes("ضغط") || d.includes("قلب") || d.toLowerCase().includes("pressure"))) {
                extraAdvice += ` ⚠️ (تنبيه: قلل من الملح في ${mealNameInArabic} هذه لسلامة قلبك).`;
            }

            await createSystemNotification(
                user.id,
                title,
                baseMessage + extraAdvice,
                "REMINDER"
            );
        }
        console.log(`${mealTime} Reminders sent successfully.`);
    } catch (error) {
        console.error(`Cron Job Error (${mealTime}):`, error);
    }
};

// 1. Breakfast & Plan Update (8:00 AM)
cron.schedule("0 8 * * *", () => {
    sendMealReminder("وقت الفطور! 🍳", "خطتك لليوم جاهزة، ابدأ يومك بوجبة صحية ونشاط.", "Breakfast");
});

// 2. Lunch Reminder (1:00 PM)
cron.schedule("0 13 * * *", () => {
    sendMealReminder("وقت الغداء! 🥗", "لا تنسَ الالتزام بالكميات المحددة في خطتك لتعزيز طاقتك.", "Lunch");
});

// 3. Water Reminder (2:00 PM - existing)
cron.schedule("0 14 * * *", async () => {
    try {
        console.log("Running Daily Water Reminder Cron Job...");
        const users = await prisma.user.findMany();
        for (const user of users) {
            await createSystemNotification(
                user.id,
                "تذكير بشرب الماء 💧",
                "لا تنسَ شرب كمية كافية من الماء اليوم للحفاظ على صحتك ونشاطك!",
                "REMINDER"
            );
        }
        console.log("Daily Water Reminders sent successfully.");
    } catch (error) {
        console.error("Cron Job Error (Water Reminder):", error);
    }
});

// 4. Snack Reminder (4:00 PM)
cron.schedule("0 16 * * *", () => {
    sendMealReminder("وقت السناك! 🍏", "وجبة خفيفة ومفيدة لتجديد نشاطك في منتصف اليوم.", "Snack");
});

// 5. Dinner Reminder (7:00 PM)
cron.schedule("0 19 * * *", () => {
    sendMealReminder("وقت العشاء! 🌙", "ختام يومك بوجبة صحية خفيفة لتساعدك على نوم هادئ.", "Dinner");
});// 6. Check for Expired Subscriptions (Midnight: 00:00)
cron.schedule("0 0 * * *", async () => {
    try {
        console.log("Running Expired Subscriptions Cron Job...");
        const now = new Date();
        const expiredUsers = await prisma.user.findMany({
            where: {
                isSubscribed: true,
                subscriptionEndDate: { lt: now }
            }
        });

        for (const user of expiredUsers) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isSubscribed: false }
            });
            await createSystemNotification(
                user.id,
                "انتهت الرحلة؟ لا تدعها تتوقف! ⚠️",
                "لقد انتهت فترة اشتراكك اليوم. نأمل أنك استمتعت بتجربتك! جدد اشتراكك الآن لتكمل مسيرتك نحو أهدافك الصحية.",
                "WARNING"
            );
        }
        if (expiredUsers.length > 0) {
            console.log(`Processed ${expiredUsers.length} expired subscriptions.`);
        } else {
            console.log("No expired subscriptions today.");
        }
    } catch (error) {
        console.error("Cron Job Error (Expired Subscriptions):", error);
    }
});

// 7. Check for Subscriptions Expiring in 3 Days (9:00 AM)
cron.schedule("0 9 * * *", async () => {
    try {
        console.log("Running 3-Day Expiry Warning Cron Job...");
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);

        const startOfTarget = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfTarget = new Date(targetDate.setHours(23, 59, 59, 999));

        const usersNearExpiry = await prisma.user.findMany({
            where: {
                isSubscribed: true,
                subscriptionEndDate: {
                    gte: startOfTarget,
                    lte: endOfTarget
                }
            }
        });

        for (const user of usersNearExpiry) {
            await createSystemNotification(
                user.id,
                "تنبيه: بقي 3 أيام فقط! ⏳",
                "أوشك اشتراكك على الانتهاء. لا تفقد زخمك! جدد اشتراكك الآن لضمان استمرار وصولك لخططك الغذائية المخصصة.",
                "WARNING"
            );
        }

        if (usersNearExpiry.length > 0) {
            console.log(`Sent expiry warnings to ${usersNearExpiry.length} users.`);
        }
    } catch (error) {
        console.error("Cron Job Error (3-Day Expiry Warning):", error);
    }
});

export default cron;
