import prisma from "../../lib/prisma.js";

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

        // Fetch current active plan
        const today = new Date();
        const plan = await prisma.plan.findFirst({
            where: {
                userId: userId,
                startDate: { lte: today },
                endDate: { gte: today }
            },
            orderBy: { createdAt: 'desc' }
        });

        let targetCalories = 2000;
        let consumedCalories = 0;
        let todayMealsFormatted = [];

        if (plan) {
            targetCalories = plan.totalCalories;

            // Calculate day number (1-indexed)
            // Reset times to start of day for accurate day calculation
            const startOfPlan = new Date(plan.startDate);
            startOfPlan.setHours(0, 0, 0, 0);
            const startOfToday = new Date(today);
            startOfToday.setHours(0, 0, 0, 0);

            const diffTime = Math.abs(startOfToday - startOfPlan);
            let dayNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because day 1 is the start date
            if (dayNumber < 1) dayNumber = 1;

            // Fetch today's meals from PlanMeal
            const planMeals = await prisma.planMeal.findMany({
                where: {
                    planId: plan.id,
                    dayNumber: dayNumber
                },
                include: {
                    meal: true
                }
            });

            todayMealsFormatted = planMeals.map(pm => {
                const adjustedCalories = Math.round(pm.meal.calories * pm.multiplier);
                consumedCalories += adjustedCalories;

                // Map time conceptually
                let timeString = "";
                if (pm.mealTime === "BREAKFAST") timeString = "08:00 صباحًا";
                else if (pm.mealTime === "LUNCH") timeString = "01:00 ظهرًا";
                else if (pm.mealTime === "DINNER") timeString = "07:00 مساءً";
                else timeString = "04:00 عصرًا";

                // Adjust portion string if it ends with 'غ' or 'g'
                let adjustedPortion = pm.meal.portion || "";
                if (adjustedPortion && pm.multiplier !== 1) {
                    const match = adjustedPortion.match(/^(\d+(?:\.\d+)?)\s*([\u063a\u0641]||g|kg)$/i);
                    if (match) {
                        const amount = parseFloat(match[1]);
                        const unit = match[2];
                        const newAmount = Math.round(amount * pm.multiplier);
                        adjustedPortion = `${newAmount}${unit}`;
                    }
                }

                return {
                    id: pm.id,
                    category: mealTimeMapper[pm.mealTime] || "وجبة",
                    timeString,
                    name: pm.meal.name,
                    calories: adjustedCalories,
                    imageUrl: pm.meal.imageUrl || null,
                    portion: adjustedPortion,
                    proteins: Math.round((pm.meal.proteins || 0) * pm.multiplier * 10) / 10,
                    fats: Math.round((pm.meal.fats || 0) * pm.multiplier * 10) / 10,
                    carbs: Math.round((pm.meal.carbs || 0) * pm.multiplier * 10) / 10,
                    ingredients: pm.meal.ingredients || []
                };
            });
        } else {
            // Fallback if no active plan
            targetCalories = user.profile?.goal === "LOSE" ? 1500 : (user.profile?.goal === "GAIN" ? 2500 : 2000);
        }

        const responseData = {
            success: true,
            data: {
                greeting: {
                    name: user.username,
                    goalText: user.profile?.goal ? (goalMapper[user.profile.goal] || "هدف غير محدد") : "لم يتم تحديد الهدف"
                },
                caloriesSummary: {
                    target: targetCalories,
                    calories: targetCalories,
                    totalCalories: targetCalories,
                    consumed: consumedCalories,
                    remaining: Math.max(0, targetCalories - consumedCalories)
                },
                todayMeals: todayMealsFormatted
            }
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
