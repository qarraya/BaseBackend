import * as progressService from "../../services/progress.service.js";

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
