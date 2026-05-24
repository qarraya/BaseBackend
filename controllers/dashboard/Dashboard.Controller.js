import prisma from "../../lib/prisma.js";
import * as planService from "../../services/plan.service.js";

const goalMapper = {
    LOSE: "إنقاص الوزن",
    MAINTAIN: "الحفاظ على الوزن",
    GAIN: "زيادة الوزن"
};

const mealTimeMapper = {
    BREAKFAST: "الإفطار",
    LUNCH: "الغداء",
    DINNER: "العشاء",
    SNACK: "وجبة خفيفة"
};

// GET /api/dashboard/today
export const getDashboardToday = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch user and profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Use the robust service that auto-generates plans if missing or expired
        const payload = await planService.getUserPlanOrGenerate(userId);
        
        if (!payload) {
             return res.status(200).json({
                success: true,
                data: {
                    greeting: {
                        name: user.username,
                        goalText: user.profile?.goal ? (goalMapper[user.profile.goal] || "هدف غير محدد") : "لم يتم تحديد الهدف"
                    },
                    caloriesSummary: { target: 2000, consumed: 0, remaining: 2000 },
                    todayMeals: []
                }
            });
        }

        const responseData = {
            success: true,
            data: {
                greeting: {
                    name: user.username,
                    goalText: user.profile?.goal ? (goalMapper[user.profile.goal] || "هدف غير محدد") : "لم يتم تحديد الهدف"
                },
                caloriesSummary: payload.caloriesSummary || {
                    target: payload.calories || 2000,
                    consumed: 0,
                    remaining: payload.calories || 2000
                },
                todayMeals: payload.meals || []
            }
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
