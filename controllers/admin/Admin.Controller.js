import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma.js";
import { createSystemNotification } from "../../utils/notificationService.js";

/**
 * --- AUTHENTICATION & PROFILE ---
 */

const adminPublic = (a) => ({
  id: a.id,
  username: a.username,
  name: a.name,
  isActive: a.isActive,
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
      tokenVersion: admin.tokenVersion // For "Logout from all devices"
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { username: username.trim() } });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    if (!admin.isActive) {
        return res.status(403).json({ message: "Account is inactive. Please contact support." });
    }
    await prisma.admin.update({ where: { id: admin.id }, data: { lastLogin: new Date() } });
    return res.status(200).json({ message: "Login successful.", token: signAdminToken(admin), admin: adminPublic(admin) });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
};

export const adminRegister = async (req, res) => {
  try {
    const { name, username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({ data: { name: name.trim(), username: username.trim(), password: hashed, lastLogin: new Date() } });
    return res.status(201).json({ message: "Admin registered.", token: signAdminToken(admin), admin: adminPublic(admin) });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
};

// Unified Account & Security Settings
export const updateAdminProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password } = req.body;
    const data = {};
    if (name) data.name = name.trim();
    if (username) data.username = username.trim();
    if (password) data.password = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.update({ where: { id }, data });
    return res.status(200).json({ message: "Profile updated.", admin: adminPublic(admin) });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
};

/**
 * --- ADVANCED SECURITY ---
 */

// Logout from all devices by incrementing tokenVersion
export const logoutAllSessions = async (req, res) => {
  try {
    const { id } = req.user; // From verifyAdmin
    await prisma.admin.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } }
    });
    res.status(200).json({ success: true, message: "Logged out from all devices successfully." });
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

// Temporary deactivate account
export const toggleAdminActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const admin = await prisma.admin.findUnique({ where: { id } });
        const updated = await prisma.admin.update({
            where: { id },
            data: { isActive: !admin.isActive, tokenVersion: { increment: 1 } } // Also log out
        });
        res.status(200).json({ success: true, message: `Admin ${updated.isActive ? 'activated' : 'deactivated'}.`, isActive: updated.isActive });
    } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

/**
 * --- NUTRITIONAL RULES (The "Brain") ---
 */

export const getNutritionalRules = async (req, res) => {
  try {
    const rules = await prisma.nutritionalRule.findMany();
    res.status(200).json({ success: true, rules });
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

export const upsertNutritionalRule = async (req, res) => {
  try {
    const { gender, activityLevel, goal, calories, protein, fats, carbs } = req.body;
    const rule = await prisma.nutritionalRule.upsert({
      where: { gender_activityLevel_goal: { gender, activityLevel, goal } },
      update: { calories, protein, fats, carbs },
      create: { gender, activityLevel, goal, calories, protein, fats, carbs }
    });
    res.status(200).json({ success: true, message: "Nutritional rule saved.", rule });
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

/**
 * --- USER & QUESTION MANAGEMENT ---
 */

export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeSubscribers = await prisma.user.count({ where: { isSubscribed: true } });
    const pendingQuestions = await prisma.question.count({ where: { status: "PENDING" } });
    res.status(200).json({ success: true, stats: { totalUsers, activeSubscribers, pendingQuestions } });
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

export const listAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, username: true, email: true, isSubscribed: true, subscriptionEndDate: true, createdAt: true } });
    res.status(200).json({ success: true, users });
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

export const toggleUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const updatedUser = await prisma.user.update({ where: { id: userId }, data: { isSubscribed: !user.isSubscribed, subscriptionEndDate: !user.isSubscribed ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null } });
    res.status(200).json({ success: true, message: "Subscription toggled.", user: updatedUser });
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

export const listAllQuestions = async (req, res) => {
  try {
    const questions = await prisma.question.findMany({ include: { user: { select: { username: true, email: true } } }, orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, questions });
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

export const answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;
    const question = await prisma.question.update({ where: { id: questionId }, data: { answer, status: "ANSWERED" } });
    await createSystemNotification(question.userId, "تم الرد على استفسارك! ✅", `لقد قام الأدمن بالإجابة على سؤالك: "${question.question.substring(0, 20)}..."`, "MESSAGE");
    res.status(200).json({ success: true, message: "Answer sent." });
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    await prisma.question.delete({ where: { id: questionId } });
    res.status(200).json({ success: true, message: "Question deleted." });
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

export const broadcastNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    const users = await prisma.user.findMany({ select: { id: true } });
    await Promise.all(users.map(u => createSystemNotification(u.id, title, message, "INFO")));
    res.status(200).json({ success: true, message: "Broadcast sent." });
  } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

/**
 * --- OTHER ADMINS ---
 */
export const listAdmins = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, username: true, name: true, isActive: true, lastLogin: true, createdAt: true } });
    res.status(200).json({ admins });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.admin.delete({ where: { id } });
    res.status(200).json({ message: "Admin deleted." });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
};
