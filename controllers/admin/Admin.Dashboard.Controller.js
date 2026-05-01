import prisma from "../../lib/prisma.js";
import { createSystemNotification } from "../../utils/notificationService.js";

/**
 * 1. GET ADMIN STATS
 * Returns a summary of the whole system.
 */
export const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const activeSubscribers = await prisma.user.count({
            where: { isSubscribed: true }
        });
        const totalMeals = await prisma.meal.count();
        const pendingQuestions = await prisma.question.count({
            where: { status: "PENDING" }
        });

        // Get recent signups (last 5)
        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, username: true, email: true, createdAt: true, isSubscribed: true }
        });

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                activeSubscribers,
                totalMeals,
                pendingQuestions
            },
            recentUsers
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};



/**
 * 4. BROADCAST NOTIFICATION
 * Sends a message to ALL users.
 */
export const broadcastNotification = async (req, res) => {
    try {
        const { title, message, type } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: "Title and message are required" });
        }

        const users = await prisma.user.findMany({ select: { id: true } });

        // Create notifications for all users
        const notificationPromises = users.map(user => 
            createSystemNotification(user.id, title, message, type || "INFO")
        );

        await Promise.all(notificationPromises);

        res.status(200).json({
            success: true,
            message: `Broadcast sent successfully to ${users.length} users.`
        });
    } catch (error) {
        console.error("Broadcast Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
