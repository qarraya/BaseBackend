import prisma from "../../lib/prisma.js";
import { createSystemNotification } from "../notification/Notification.Controller.js";

/**
 * 1. LIST PENDING QUESTIONS
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
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, questions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * 2. LIST ALL QUESTIONS (HISTORY)
 */
export const listAllQuestions = async (req, res) => {
    try {
        const questions = await prisma.question.findMany({
            include: {
                user: {
                    select: { username: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, questions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * 3. ANSWER A QUESTION
 */
export const answerQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { answer } = req.body;

        if (!answer) {
            return res.status(400).json({ success: false, message: "Answer is required" });
        }

        const question = await prisma.question.update({
            where: { id: questionId },
            data: {
                answer,
                status: "ANSWERED"
            }
        });

        // Notify user
        await createSystemNotification(
            question.userId,
            "تم الرد على استفسارك! ✅",
            `لقد قام الأدمن بالإجابة على سؤالك: "${question.question.substring(0, 20)}..."`,
            "MESSAGE"
        );

        res.status(200).json({
            success: true,
            message: "Answer sent and user notified.",
            question
        });
    } catch (error) {
        console.error("AnswerQuestion Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * 4. DELETE A QUESTION (ADMIN ONLY)
 */
export const deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        await prisma.question.delete({
            where: { id: questionId }
        });
        res.status(200).json({ success: true, message: "Question deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
