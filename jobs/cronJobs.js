import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { createSystemNotification } from "../utils/notificationService.js";

const prisma = new PrismaClient();

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
});

export default cron;
