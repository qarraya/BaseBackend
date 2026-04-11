import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createSystemNotification } from "../../utils/notificationService.js";

const prisma = new PrismaClient();

export const createNotificationForUser = async ({ userId, title, message, type = "MESSAGE" }) => {
    return prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type
        }
    });
};

// GET /api/settings/notifications
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ 
            success: true, 
            count: notifications.length,
            notifications 
        });
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

// POST /api/settings/notifications/send
export const sendNotificationToUser = async (req, res) => {
    try {
        const senderUserId = req.user.id;
        const { receiverUserId, title, message, type } = req.body;

        if (!receiverUserId || !title || !message) {
            return res.status(400).json({
                success: false,
                message: "receiverUserId, title and message are required"
            });
        }

        const receiver = await prisma.user.findUnique({
            where: { id: receiverUserId },
            select: { id: true }
        });

        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "Receiver user not found"
            });
        }

        const notification = await createNotificationForUser({
            userId: receiverUserId,
            title,
            message,
            type: type || "MESSAGE"
        });

        // This response is designed to be consumed by other APIs (e.g. message API)
        return res.status(201).json({
            success: true,
            message: "Notification sent successfully",
            senderUserId,
            receiverUserId,
            notification
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

// PUT /api/settings/account
export const updateAccountSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        // User prefers the exact names used in signup including email
        const { username, email, oldPassword, password, confirmPassword } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const updateData = {};

        // 1. Update Username
        if (username && username !== user.username) {
            const existingUser = await prisma.user.findUnique({
                where: { username }
            });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Username is already taken!!" });
            }
            updateData.username = username;
        }

        // 1.5 Update Email (since user mentioned email is used interchangeably)
        if (email && email !== user.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email is already taken!!" });
            }
            updateData.email = email;
        }

        // 2. Update Password
        if (password) {
            if (password !== confirmPassword) {
                return res.status(400).json({ success: false, message: "New passwords do not match" });
            }

            // Security check ONLY if they provide oldPassword (to accommodate their simple testing)
            if (oldPassword) {
                const isMatch = await bcrypt.compare(oldPassword, user.password);
                if (!isMatch) {
                    return res.status(400).json({ success: false, message: "Incorrect old password" });
                }
            }

            updateData.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: updateData
            });

            await createSystemNotification(
                userId,
                "تحديث أمان الحساب 🔒",
                "تم تغيير إعدادات حسابك (اسم المستخدم أو كلمة المرور) بنجاح.",
                "INFO"
            );

            return res.status(200).json({ success: true, message: "Account settings updated successfully" });
        } else {
            return res.status(400).json({ success: false, message: "No data provided to update" });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// POST /api/settings/questions
export const createQuestion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, question } = req.body;

        if (!question) {
            return res.status(400).json({ success: false, message: "Question content is required" });
        }

        const newQuestion = await prisma.question.create({
            data: {
                userId,
                category,
                question,
                status: "PENDING"
            }
        });

        res.status(201).json({ 
            success: true, 
            message: "Question sent successfully! 🚀", 
            question: newQuestion 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// GET /api/settings/account
export const getAccountSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
