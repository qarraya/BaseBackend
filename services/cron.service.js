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

        /* 1. Paid Subscription Expiry */
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

        /* 2. Trial Period Expiry (Exactly 30 days ago) */
        // We look for users created between (now - 31 days) and (now - 30 days) 
        // who haven't been notified yet or just hit the mark.
        // Actually, to avoid multiple notifications, we might need a flag, 
        // but for a simple cron we can check the exact day.
        
        const thirtyDaysAgoStart = new Date(now);
        thirtyDaysAgoStart.setDate(thirtyDaysAgoStart.getDate() - 30);
        thirtyDaysAgoStart.setHours(0,0,0,0);
        
        const thirtyDaysAgoEnd = new Date(now);
        thirtyDaysAgoEnd.setDate(thirtyDaysAgoEnd.getDate() - 30);
        thirtyDaysAgoEnd.setHours(23,59,59,999);

        const expiredTrialUsers = await prisma.user.findMany({
            where: {
                isSubscribed: false,
                createdAt: {
                    gte: thirtyDaysAgoStart,
                    lte: thirtyDaysAgoEnd
                }
            }
        });

        for (const user of expiredTrialUsers) {
            await createSystemNotification(
                user.id,
                "انتهت الفترة التجريبية 🔚",
                "لقد انتهت الـ 30 يوماً التجريبية الخاصة بك. نتمنى أن تكون قد استفدت! اشترك الآن لتستمر في الحصول على خطط غذائية بلا حدود.",
                "INFO"
            );
        }

        const totalProcessed = expiredUsers.length + expiredTrialUsers.length;
        console.log(`Processed ${totalProcessed} expired (Sub: ${expiredUsers.length}, Trial: ${expiredTrialUsers.length}).`);
        return { success: true, processed: totalProcessed };
    } catch (error) {
        console.error("Cron Job Error (Expired Subscriptions):", error);
        throw error;
    }
};

export const checkNearExpirySubscriptions = async () => {
    try {
        console.log("Running 3-Day Expiry Warning Cron Job...");
        const now = new Date();
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);

        const startOfTarget = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfTarget = new Date(targetDate.setHours(23, 59, 59, 999));

        /* 1. Paid Subscription Near Expiry */
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

        /* 2. Trial Period Near Expiry (30 days from creation) */
        // If today is targetDate, trialEndDate is 30 days from createdAt.
        // trialEndDate = createdAt + 30 days.
        // If trialEndDate is in [startOfTarget, endOfTarget], then:
        // createdAt + 30 days is in [startOfTarget, endOfTarget].
        // createdAt is in [startOfTarget - 30 days, endOfTarget - 30 days].

        const startOfTrialCreationTarget = new Date(startOfTarget);
        startOfTrialCreationTarget.setDate(startOfTrialCreationTarget.getDate() - 30);
        const endOfTrialCreationTarget = new Date(endOfTarget);
        endOfTrialCreationTarget.setDate(endOfTrialCreationTarget.getDate() - 30);

        const usersNearTrialExpiry = await prisma.user.findMany({
            where: {
                isSubscribed: false, // Only those who haven't subscribed yet
                createdAt: {
                    gte: startOfTrialCreationTarget,
                    lte: endOfTrialCreationTarget
                }
            }
        });

        for (const user of usersNearTrialExpiry) {
            await createSystemNotification(
                user.id,
                "تنبيه: قارب شهرك المجاني على الانتهاء! 🎁",
                "بقي 3 أيام فقط على انتهاء فترتك التجريبية المجانية. اشترك الآن لتستمر في الحصول على أفضل الخطط الغذائية والنصائح الصحية!",
                "WARNING"
            );
        }

        const totalNotified = usersNearExpiry.length + usersNearTrialExpiry.length;
        console.log(`Sent expiry warnings to ${totalNotified} users (${usersNearExpiry.length} sub, ${usersNearTrialExpiry.length} trial).`);
        return { success: true, notified: totalNotified };
    } catch (error) {
        console.error("Cron Job Error (3-Day Expiry Warning):", error);
        throw error;
    }
};
