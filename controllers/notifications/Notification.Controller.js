import prisma from "../../lib/prisma.js";


// 🔹 GET MY NOTIFICATIONS (Marks all as read automatically on fetch)
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`Fetching notifications for user: ${userId} and marking as read...`);

        // 1. Fetch current notifications
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        // 2. Mark all as read in the background (or await if you want accuracy in current response)
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
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