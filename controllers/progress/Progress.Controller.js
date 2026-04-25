import * as progressService from "../../services/progress.service.js";
import prisma from "../../lib/prisma.js";


/**
 * GET /api/progress/dashboard
 * Aggregated data for the frontend dashboard: current weight, initial weight, total change, and chart history.
 */
export const getProgressDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // 1. Fetch user profile and progress history
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const history = await progressService.getUserProgressHistory(userId, { order: "asc" });

    // 2. Map Goal Text
    const goalMapper = {
        LOSE: "إنقاص الوزن",
        MAINTAIN: "الحفاظ على الوزن",
        GAIN: "زيادة الوزن"
    };
    const goalText = user.profile?.goal ? (goalMapper[user.profile.goal] || "هدف غير محدد") : "لم يتم تحديد الهدف";

    // 3. Current weight logic
    const currentWeight = user.profile?.currentWeight || (history.length > 0 ? history[history.length - 1].newWeight : 0);
    const initialWeight = history.length > 0 ? history[0].previousWeight : currentWeight;
    const weightChange = Number((currentWeight - initialWeight).toFixed(1));

    // Calculate dynamic target weight based on staged 10% milestone
    let calculatedTargetWeight = currentWeight;

    if (user.profile?.goal === 'LOSE') {
        calculatedTargetWeight = Number((initialWeight * 0.90).toFixed(1)); // Target 10% loss
    } else if (user.profile?.goal === 'GAIN') {
        calculatedTargetWeight = Number((initialWeight * 1.10).toFixed(1)); // Target 10% gain
    } else {
        calculatedTargetWeight = currentWeight; // MAINTAIN
    }

    // 4. chartData (history)
    const chartData = history.map(h => ({
      date: h.date,
      weight: h.newWeight
    }));

    // 5. Comparison logic (Start of month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Find the record closest to the start of the month
    const startOfMonthRecord = await prisma.progress.findFirst({
      where: {
        userId,
        date: { gte: startOfMonth }
      },
      orderBy: { date: 'asc' }
    });

    const startOfMonthWeight = startOfMonthRecord ? startOfMonthRecord.previousWeight : initialWeight;
    const monthChange = Number((currentWeight - startOfMonthWeight).toFixed(1));

    // 6. Fetch Active Plan (for average calories and macros)
    const activePlan = await prisma.plan.findFirst({
        where: { userId },
        include: {
            meals: {
                include: { meal: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    let carbsAvg = 45; // Default fallback
    let proteinAvg = 30; // Default fallback
    let planTotalCalories = activePlan ? activePlan.totalCalories : 1934;

    if (activePlan && activePlan.meals.length > 0) {
        let totalCarbsGrams = 0;
        let totalProteinGrams = 0;
        let totalPlanCals = 0;

        activePlan.meals.forEach(pm => {
            const mult = pm.multiplier || 1.0;
            totalCarbsGrams += (pm.meal.carbs || 0) * mult;
            totalProteinGrams += (pm.meal.proteins || 0) * mult;
            totalPlanCals += (pm.meal.calories || 0) * mult;
        });

        if (totalPlanCals > 0) {
            // Calculate % of calories from each macro (Grams * 4 / Total Calories)
            carbsAvg = Math.round((totalCarbsGrams * 4 / totalPlanCals) * 100);
            proteinAvg = Math.round((totalProteinGrams * 4 / totalPlanCals) * 100);
            planTotalCalories = Math.round(totalPlanCals / Math.max(1, activePlan.meals.length / 3)); // Approximate daily avg if multi-day
            
            // Overwrite with the stored totalCalories if it exists for consistency
            if (activePlan.totalCalories) planTotalCalories = activePlan.totalCalories;
        }
    }

    // 7. Weekly Summary Calculations
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const lastWeekRecord = await prisma.progress.findFirst({
      where: {
        userId,
        date: { lte: sevenDaysAgo }
      },
      orderBy: { date: 'desc' }
    });

    const lastWeekWeight = lastWeekRecord ? lastWeekRecord.newWeight : (history.length > 0 ? history[0].previousWeight : currentWeight);
    const weeklyLoss = Number((currentWeight - lastWeekWeight).toFixed(1));

    // Commitment (Adherence)
    const startDate = history.length > 0 ? history[0].date : user.createdAt;
    const daysSinceJoined = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
    
    // Calculate adherence based on current day of the week (assuming week starts on Monday=1, Sunday=7)
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); 
    const adherenceDays = `${dayOfWeek}/7`;

    return res.status(200).json({
      success: true,
      data: {
        // --- 1. Top Card (Goal) ---
        goalText,
        currentWeight,
        targetWeight: calculatedTargetWeight || 0,

        // --- 2. Monthly Progress ---
        monthlyProgress: {
          lostWeight: Math.abs(monthChange),
          carbsAvg: carbsAvg,
          proteinAvg: proteinAvg,
          startDate: history.length > 0 ? history[0].date : startOfMonth,
          endDate: now,
        },

        // --- 3. Weekly Summary ---
        weeklySummary: {
          averageWeight: currentWeight,
          weeklyLoss: weeklyLoss,
          averageCalories: planTotalCalories,
          adherenceDays: adherenceDays,
          weeklyRating: weeklyLoss < 0 ? "ممتاز" : "جيد",
        },

        // --- 4. Streaks ---
        streak: {
          days: daysSinceJoined,
        },

        // --- Legacy/Existing Data ---
        chartData,
        weightChange,
        comparison: {
          metric: "الوزن",
          startOfMonthWeight,
          currentWeight,
          change: monthChange
        }
      },
    });
  } catch (error) {
    console.error("getProgressDashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
