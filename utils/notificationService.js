import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createSystemNotification = async (userId, title, message, type) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type, // e.g., "INFO", "MESSAGE", "REMINDER", "SUCCESS", "WARNING", "ERROR"
      },
    });
    return notification;
  } catch (error) {
    console.error("System Notification Error:", error);
  }
};
