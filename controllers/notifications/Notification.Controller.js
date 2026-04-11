import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


// 🔹 GET MY NOTIFICATIONS
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`Fetching notifications for user: ${userId}`);

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


// 🔹 MARK SINGLE NOTIFICATION AS READ
export const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const notification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        if (notification.userId !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification: updatedNotification,
        });
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


// 🔹 MARK ALL NOTIFICATIONS AS READ
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });

        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        console.error("Mark All Read Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


// 🔹 SEND NOTIFICATION TO USER
export const sendNotificationToUser = async (req, res) => {
    try {
        const { userId, title, message, type } = req.body;

        if (!userId || !title || !message || !type) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
            },
        });

        res.status(201).json({
            success: true,
            message: "Notification sent successfully",
            notification,
        });
    } catch (error) {
        console.error("Send Notification Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};