import { PrismaClient } from "@prisma/client";
import { createSystemNotification } from "./utils/notificationService.js";

const prisma = new PrismaClient();

const testRemindersWithAdvice = async () => {
    try {
        console.log("Simulating Meal Reminder with Disease Advice...");
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
             
             const title = "وقت الغداء! 🥗";
             const mealNameInArabic = "وجبة الغداء";

             if (diseases.some(d => d.includes("سكري") || d.toLowerCase().includes("diabet"))) {
                 extraAdvice += ` ⚠️ (تنبيه: قلل من السكريات في ${mealNameInArabic} هذه).`;
             }
             if (diseases.some(d => d.includes("ضغط") || d.includes("قلب") || d.toLowerCase().includes("pressure"))) {
                 extraAdvice += ` ⚠️ (تنبيه: قلل من الملح في ${mealNameInArabic} هذه لسلامة قلبك).`;
             }

             console.log(`User: ${user.username}, Diseases: ${diseases.join(", ") || "None"}`);
             console.log(`Message: ${title} + ${extraAdvice}`);
             
             // Send a test notification for the first user with diseases to verify
             if (extraAdvice) {
                 await createSystemNotification(
                     user.id,
                     "تجرية: نصيحة صحية مخصصة",
                     "لقد اخترنا لك هذه النصيحة بناءً على ملفك الصحي:" + extraAdvice,
                     "REMINDER"
                 );
                 console.log(`Test notification sent to ${user.username}`);
             }
        }
        console.log("Test finished.");
    } catch (error) {
        console.error("Test Error:", error);
    } finally {
        await prisma.$disconnect();
    }
};

testRemindersWithAdvice();
