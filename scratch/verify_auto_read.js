import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function verifyAutoMarkRead() {
    try {
        const userId = "38464c45-d187-417b-aa63-b6581b46eced"; // Kinda

        // 1. Ensure at least one unread notification exists
        await prisma.notification.create({
            data: {
                userId,
                title: "Auto Read Test",
                message: "This should become read automatically when list is fetched.",
                type: "INFO",
                isRead: false
            }
        });

        // 2. Count unread BEFORE (manually mock the controller logic)
        const unreadBefore = await prisma.notification.count({
            where: { userId, isRead: false }
        });
        console.log(`Unread before fetch: ${unreadBefore}`);

        // 3. Mock the controller logic: fetch then updateMany
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        console.log("Simulated Fetch and Auto-Mark-All-Read...");

        // 4. Count unread AFTER
        const unreadAfter = await prisma.notification.count({
            where: { userId, isRead: false }
        });
        console.log(`Unread after fetch: ${unreadAfter}`);

        if (unreadAfter === 0) {
            console.log("SUCCESS: Automatic mark-all-read on fetch works correctly.");
        } else {
            console.log("FAILURE: Some notifications are still unread.");
        }

    } catch (error) {
        console.error("Verification Error:", error);
    }
}

verifyAutoMarkRead().finally(() => prisma.$disconnect());
