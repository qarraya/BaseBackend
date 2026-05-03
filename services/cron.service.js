import prisma from "../lib/prisma.js";
import { createSystemNotification } from "../utils/notificationService.js";

export const sendMealReminder = async (title, baseMessage, mealTime) => {
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
        return { success: true, message: `${mealTime} Reminders sent successfully.` };
    } catch (error) {
        console.error(`Cron Job Error (${mealTime}):`, error);
        throw error;
    }
};

export const sendWaterReminder = async () => {
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
        return { success: true, message: "Daily Water Reminders sent successfully." };
    } catch (error) {
        console.error("Cron Job Error (Water Reminder):", error);
        throw error;
    }
};

export const checkExpiredSubscriptions = async () => {
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
        console.log(`Processed ${expiredUsers.length} expired subscriptions.`);
        return { success: true, processed: expiredUsers.length };
    } catch (error) {
        console.error("Cron Job Error (Expired Subscriptions):", error);
        throw error;
    }
};

export const checkNearExpirySubscriptions = async () => {
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

        console.log(`Sent expiry warnings to ${usersNearExpiry.length} users.`);
        return { success: true, notified: usersNearExpiry.length };
    } catch (error) {
        console.error("Cron Job Error (3-Day Expiry Warning):", error);
        throw error;
    }
};
