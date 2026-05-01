import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma.js";
import { createSystemNotification } from "../../utils/notificationService.js";

/**
 * --- AUTHENTICATION ---
 */

const adminPublic = (a) => ({
  id: a.id,
  username: a.username,
  name: a.name,
  lastLogin: a.lastLogin,
  createdAt: a.createdAt,
});

const signAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: "admin",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
    const admin = await prisma.admin.findUnique({
      where: { username: username.trim() },
    });
    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });
    const token = signAdminToken(admin);
    return res.status(200).json({
      message: "Login successful.",
      token,
      admin: adminPublic(admin),
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

export const adminRegister = async (req, res) => {
  try {
    const { name, username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        password: hashed,
        lastLogin: new Date(),
      },
    });
    const token = signAdminToken(admin);
    return res.status(201).json({
      message: "Admin registered successfully.",
      token,
      admin: adminPublic(admin),
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * --- MANAGEMENT (STATS & QUESTIONS) ---
 */

export const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const activeSubscribers = await prisma.user.count({ where: { isSubscribed: true } });
        const pendingQuestions = await prisma.question.count({ where: { status: "PENDING" } });

        res.status(200).json({
            success: true,
            stats: { totalUsers, activeSubscribers, pendingQuestions }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const listAllQuestions = async (req, res) => {
    try {
        const questions = await prisma.question.findMany({
            include: { user: { select: { username: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, questions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const answerQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { answer } = req.body;
        const question = await prisma.question.update({
            where: { id: questionId },
            data: { answer, status: "ANSWERED" }
        });
        await createSystemNotification(
            question.userId,
            "تم الرد على استفسارك! ✅",
            `لقد قام الأدمن بالإجابة على سؤالك: "${question.question.substring(0, 20)}..."`,
            "MESSAGE"
        );
        res.status(200).json({ success: true, message: "Answer sent." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        await prisma.question.delete({ where: { id: questionId } });
        res.status(200).json({ success: true, message: "Question deleted." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const broadcastNotification = async (req, res) => {
    try {
        const { title, message } = req.body;
        const users = await prisma.user.findMany({ select: { id: true } });
        await Promise.all(users.map(u => createSystemNotification(u.id, title, message, "INFO")));
        res.status(200).json({ success: true, message: "Broadcast sent." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * --- ADMIN MANAGEMENT (LIST/UPDATE/DELETE) ---
 */

export const listAdmins = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, username: true, name: true, lastLogin: true, createdAt: true },
    });
    return res.status(200).json({ admins });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, password } = req.body;
    const data = {};
    if (name) data.name = name.trim();
    if (username) data.username = username.trim();
    if (email) data.email = email.trim().toLowerCase();
    if (password) data.password = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.update({ where: { id }, data });
    return res.status(200).json({ message: "Admin updated.", admin });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.admin.delete({ where: { id } });
    return res.status(200).json({ message: "Admin deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};
