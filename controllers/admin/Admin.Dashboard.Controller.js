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
 * 2. LIST ALL PENDING QUESTIONS
 */
export const listPendingQuestions = async (req, res) => {
    try {
        const questions = await prisma.question.findMany({
            where: { status: "PENDING" },
            include: {
                user: {
                    select: { username: true, email: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.status(200).json({ success: true, questions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * 3. ANSWER A QUESTION
 * Updates the question and notifies the user.
 */
export const answerQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { answer } = req.body;

        if (!answer) {
            return res.status(400).json({ success: false, message: "Answer content is required" });
        }

        const question = await prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }

        // Update the question
        const updatedQuestion = await prisma.question.update({
            where: { id: questionId },
            data: {
                answer,
                status: "ANSWERED"
            }
        });

        // Send notification to the user
        await createSystemNotification(
            question.userId,
            "تم الرد على استفسارك! ✅",
            `لقد قام الأدمن بالإجابة على سؤالك: "${question.question.substring(0, 20)}..."`,
            "MESSAGE"
        );

        res.status(200).json({
            success: true,
            message: "Answer sent successfully and user notified",
            question: updatedQuestion
        });
    } catch (error) {
        console.error("Answer Question Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
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
