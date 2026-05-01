import prisma from "../../lib/prisma.js";


// 🔹 GET MY NOTIFICATIONS (Marks all as read automatically on fetch - Restored for frontend compatibility)
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Fetch current notifications
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        // 2. Mark all as read automatically (Restoring previous behavior to fix frontend visibility issues)
        if (notifications.length > 0) {
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
        }

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

// 🔹 MARK NOTIFICATION AS READ (Single)
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const notificationId = Number(id); // Convert to Number for Prisma

        if (isNaN(notificationId)) {
            return res.status(400).json({ success: false, message: "Invalid notification ID" });
        }

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        if (notification.userId !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification: updatedNotification
        });
    } catch (error) {
        console.error("Mark As Read Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};