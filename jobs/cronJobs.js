import cron from "node-cron";
import prisma from "../lib/prisma.js";
import { createSystemNotification } from "../utils/notificationService.js";

/** 
 * CORE LOGIC FUNCTIONS
 * These are called by node-cron (locally) OR by the Vercel Cron trigger.
 */

export const sendMealReminder = async (title, baseMessage, mealTime) => {
    try {
        console.log(`Running ${mealTime} Reminder...`);
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

            const mealNameInArabic = title.includes("فطور") ? "وجبة الفطور" :
                title.includes("غداء") ? "وجبة الغداء" :
                    title.includes("عشاء") ? "وجبة العشاء" :
                        title.includes("سناك") ? "وجبة السناك" : "هذه الوجبة";

            if (diseases.some(d => d.includes("سكري") || d.toLowerCase().includes("diabet"))) {
                extraAdvice += ` ⚠️ (تنبيه: قلل من السكريات في ${mealNameInArabic} هذه).`;
            }
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
        console.log(`${mealTime} Reminders processed successfully.`);
    } catch (error) {
        console.error(`Cron Job Error (${mealTime}):`, error);
    }
};

export const handleWaterReminder = async () => {
    try {
        console.log("Running Daily Water Reminder...");
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
};

export const handleSubscriptionExpiry = async () => {
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
    } catch (error) {
        console.error("Cron Job Error (Expired Subscriptions):", error);
    }
};

export const handleThreeDayWarning = async () => {
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
    } catch (error) {
        console.error("Cron Job Error (3-Day Expiry Warning):", error);
    }
};

/**
 * LOCAL SCHEDULES (node-cron)
 */
// 8:00 AM - Breakfast
cron.schedule("0 8 * * *", () => sendMealReminder("وقت الفطور! 🍳", "خطتك لليوم جاهزة، ابدأ يومك بوجبة صحية ونشاط.", "Breakfast"));
// 1:00 PM - Lunch
cron.schedule("0 13 * * *", () => sendMealReminder("وقت الغداء! 🥗", "لا تنسَ الالتزام بالكميات المحددة في خطتك لتعزيز طاقتك.", "Lunch"));
// 2:00 PM - Water (Original Time)
cron.schedule("0 14 * * *", () => handleWaterReminder());
// 4:00 PM - Snack
cron.schedule("0 16 * * *", () => sendMealReminder("وقت السناك! 🍏", "وجبة خفيفة ومفيدة لتجديد نشاطك في منتصف اليوم.", "Snack"));
// 7:00 PM - Dinner
cron.schedule("0 19 * * *", () => sendMealReminder("وقت العشاء! 🌙", "ختام يومك بوجبة صحية خفيفة لتساعدك على نوم هادئ.", "Dinner"));
// 00:00 - Expiry
cron.schedule("0 0 * * *", () => handleSubscriptionExpiry());
// 9:00 AM - 3-Day Warning
cron.schedule("0 9 * * *", () => handleThreeDayWarning());

export default cron;
