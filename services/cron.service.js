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

        await Promise.all(users.map(async (user) => {
            if (!user.profile) return;

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

            return createSystemNotification(
                user.id,
                title,
                baseMessage + extraAdvice,
                "REMINDER"
            );
        }));
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
        await Promise.all(users.map(user => 
            createSystemNotification(
                user.id,
                "تذكير بشرب الماء 💧",
                "لا تنسَ شرب كمية كافية من الماء اليوم للحفاظ على صحتك ونشاطك!",
                "REMINDER"
            )
        ));
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

        await Promise.all(expiredUsers.map(async (user) => {
            await prisma.user.update({
                where: { id: user.id },
                data: { isSubscribed: false }
            });
            return createSystemNotification(
                user.id,
                "انتهت الرحلة؟ لا تدعها تتوقف! ⚠️",
                "لقد انتهت فترة اشتراكك اليوم. نأمل أنك استمتعت بتجربتك! جدد اشتراكك الآن لتكمل مسيرتك نحو أهدافك الصحية.",
                "WARNING"
            );
        }));

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
                inTrial: true,
                trialStartDate: {
                    gte: thirtyDaysAgoStart,
                    lte: thirtyDaysAgoEnd
                }
            }
        });

        await Promise.all(expiredTrialUsers.map(async (user) => {
            await prisma.user.update({
                where: { id: user.id },
                data: { inTrial: false }
            });
            return createSystemNotification(
                user.id,
                "انتهت الفترة التجريبية 🔚",
                "لقد انتهت الـ 30 يوماً التجريبية الخاصة بك. نتمنى أن تكون قد استفدت! اشترك الآن لتستمر في الحصول على خطط غذائية بلا حدود.",
                "INFO"
            );
        }));

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

        await Promise.all([...usersNearExpiry, ...usersNearTrialExpiry].map(user => {
            const isTrial = !user.isSubscribed;
            const title = isTrial ? "تنبيه: قارب شهرك المجاني على الانتهاء! 🎁" : "تنبيه: بقي 3 أيام فقط! ⏳";
            const message = isTrial 
                ? "بقي 3 أيام فقط على انتهاء فترتك التجريبية المجانية. اشترك الآن لتستمر في الحصول على أفضل الخطط الغذائية والنصائح الصحية!"
                : "أوشك اشتراكك على الانتهاء. لا تفقد زخمك! جدد اشتراكك الآن لضمان استمرار وصولك لخططك الغذائية المخصصة.";
            
            return createSystemNotification(user.id, title, message, "WARNING");
        }));

        const totalNotified = usersNearExpiry.length + usersNearTrialExpiry.length;
        console.log(`Sent expiry warnings to ${totalNotified} users (${usersNearExpiry.length} sub, ${usersNearTrialExpiry.length} trial).`);
        return { success: true, notified: totalNotified };
    } catch (error) {
        console.error("Cron Job Error (3-Day Expiry Warning):", error);
        throw error;
    }
};
