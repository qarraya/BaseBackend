import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


// 🔹 GET MY NOTIFICATIONS
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// 🔹 SEND NOTIFICATION TO USER
export const sendNotificationToUser = async (req, res) => {
    try {
        const { userId, title, message, type } = req.body;

        // تحقق بسيط
        if (!userId || !title || !message || !type) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type, // لازم يكون من enum
            },
        });

        res.status(201).json({
            message: "Notification sent successfully",
            notification,
        });
    } catch (error) {
        console.error("Send Notification Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};