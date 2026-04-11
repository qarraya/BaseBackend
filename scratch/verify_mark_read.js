import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function verifyMarkAsRead() {
    try {
        const userId = "38464c45-d187-417b-aa63-b6581b46eced"; // Kinda

        // 1. Create a dummy notification
        const notif = await prisma.notification.create({
            data: {
                userId,
                title: "Test Mark Read",
                message: "Checking if the mark as read feature works.",
                type: "INFO",
                isRead: false
            }
        });
        console.log(`Created test notification: ${notif.id}, isRead: ${notif.isRead}`);

        // 2. Mocking the update logic from controller
        const updated = await prisma.notification.update({
            where: { id: notif.id },
            data: { isRead: true }
        });
        console.log(`Updated notification: ${updated.id}, isRead: ${updated.isRead}`);

        if (updated.isRead === true) {
            console.log("SUCCESS: Notification marked as read successfully.");
        } else {
            console.log("FAILURE: Notification is still unread.");
        }

        // 3. Test mark all as read
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        
        const remainingUnread = await prisma.notification.count({
            where: { userId, isRead: false }
        });
        console.log(`Remaining unread for user: ${remainingUnread}`);
        
        if (remainingUnread === 0) {
            console.log("SUCCESS: All notifications marked as read successfully.");
        }

        // Cleanup
        await prisma.notification.delete({ where: { id: notif.id } });

    } catch (error) {
        console.error("Verification Error:", error);
    }
}

verifyMarkAsRead().finally(() => prisma.$disconnect());
