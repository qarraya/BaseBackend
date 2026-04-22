import * as progressService from "../../services/progress.service.js";
import prisma from "../../lib/prisma.js";

/**
 * GET /api/progress/me — authenticated user’s progress, newest first by default.
 * Query: ?order=asc for chronological (oldest first).
 */
export const getMyProgressHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const order = req.query?.order === "asc" ? "asc" : "desc";
    const history = await progressService.getUserProgressHistory(userId, { order });

    return res.status(200).json({
      success: true,
      count: history.length,
      order,
      history,
    });
  } catch (error) {
    console.error("getMyProgressHistory:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

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

    return res.status(200).json({
      success: true,
      data: {
        currentWeight,
        weightChange,
        goalText,
        chartData,
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
