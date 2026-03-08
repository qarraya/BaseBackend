import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/settings/notifications
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// GET /api/settings/questions
export const getMyQuestions = async (req, res) => {
    try {
        const userId = req.user.id;
        const questions = await prisma.question.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, questions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// GET /api/settings/plans/current
export const getCurrentPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();

        // Find active plan
        const plan = await prisma.plan.findFirst({
            where: {
                userId: userId,
                startDate: { lte: today },
                endDate: { gte: today }
            },
            include: {
                meals: {
                    include: { meal: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!plan) {
            return res.status(404).json({ success: false, message: "No active plan found" });
        }

        res.status(200).json({ success: true, plan });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
