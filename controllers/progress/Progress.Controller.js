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

    // 1. Get history (oldest first for stats calculation)
    const history = await progressService.getUserProgressHistory(userId, { order: "asc" });

    // 2. Get profile for current weight (as fallback/source of truth)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const currentWeight = user?.profile?.currentWeight || (history.length > 0 ? history[history.length - 1].newWeight : 0);
    const initialWeight = history.length > 0 ? history[0].previousWeight : currentWeight;
    const totalChange = history.length > 0 ? (currentWeight - initialWeight) : 0;

    // 3. Format history for chart
    const chartData = history.map(h => ({
      date: h.date,
      weight: h.newWeight
    }));

    // Add current point if not already there or to ensure freshness
    if (chartData.length === 0 || chartData[chartData.length - 1].weight !== currentWeight) {
        // Only add if we have a current weight
        if (currentWeight > 0) {
            // Check if last entry's date is today
            const lastDate = chartData.length > 0 ? new Date(chartData[chartData.length - 1].date).toDateString() : null;
            const today = new Date().toDateString();
            
            if (lastDate !== today) {
                chartData.push({ date: new Date(), weight: currentWeight });
            }
        }
    }

    return res.status(200).json({
      success: true,
      data: {
        currentWeight,
        initialWeight,
        totalChange: Number(totalChange.toFixed(1)),
        history: chartData,
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
