import prisma from "../../lib/prisma.js";

/**
 * POST /api/questions
 * Allows a user to ask a new question.
 */
export const askQuestion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { question, category } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: "Question content is required" });
    }

    const newQuestion = await prisma.question.create({
      data: {
        userId,
        question: question.trim(),
        category: category?.trim() || "عام",
        status: "PENDING"
      }
    });

    res.status(201).json({
      success: true,
      message: "تم إرسال سؤالك بنجاح! سيقوم الخبير بالرد عليك قريباً.",
      question: newQuestion
    });
  } catch (error) {
    console.error("Ask Question Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/questions
 * Fetches all questions asked by the logged-in user.
 */
export const getMyQuestions = async (req, res) => {
  try {
    const userId = req.user.id;

    const questions = await prisma.question.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json({
      success: true,
      questions
    });
  } catch (error) {
    console.error("Get My Questions Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
