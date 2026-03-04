import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// nodemailer موجود بس مش مستخدم بالـ forgotPassword التجريبي
import nodemailer from "nodemailer";

dotenv.config();

const prisma = new PrismaClient({
  log: ["error"],
});

// ------------------- Sign Up -------------------
export const signUp = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      gender,
      age,
      currentWeight,
      activityLevel,
      height,
      goal,
      chronicDiseasesIds, // optional array
    } = req.body;

    const missingFields = [];
    if (!username) missingFields.push("username");
    if (!email) missingFields.push("email");
    if (!password) missingFields.push("password");
    if (!confirmPassword) missingFields.push("confirmPassword");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Validation failed. Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { username: { equals: username, mode: "insensitive" } },
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email or username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          isVerified: true,
        },
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          gender,
          age: age ? Number(age) : null,
          height: height ? Number(height) : null,
          currentWeight: currentWeight ? Number(currentWeight) : null,
          goal,
          activityLevel,
          chronicDiseases: {
            create: (chronicDiseasesIds && Array.isArray(chronicDiseasesIds))
              ? chronicDiseasesIds.map((id) => ({
                  chronicDisease: { connect: { id: Number(id) } },
                }))
              : [],
          },
        },
        include: {
          chronicDiseases: { include: { chronicDisease: true } },
        },
      });

      return { user, profile };
    });

    return res.status(201).json({
      message: "User and Profile created successfully.",
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        createdAt: result.user.createdAt,
      },
      profile: result.profile,
    });

  } catch (error) {
    console.error("SignUp Error:", error);
    if (error.code === "P2002") {
      const field = error.meta?.target?.join(", ");
      return res.status(400).json({ message: `Duplicate value for field: ${field}` });
    }
    if (error.code === "P2025") {
      return res.status(400).json({ message: "One or more Chronic Disease IDs do not exist." });
    }
    return res.status(500).json({ message: "Internal server error.", error: error.message });
  }
};

// ------------------- Log In -------------------
export const logIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: "insensitive" } },
          { email: { equals: username, mode: "insensitive" } },
        ],
      },
      include: {
        profile: {
          include: { chronicDiseases: { include: { chronicDisease: true } } },
        },
      },
    });

    if (!user) return res.status(400).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("auth_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        profile: user.profile,
        accessToken,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ------------------- Get User Data -------------------
export const getUserData = async (req, res) => {
  try {
    if (!req.cookies || !req.cookies.auth_token) {
      return res.status(401).json({ message: "Authentication token not found." });
    }

    const decoded = jwt.verify(req.cookies.auth_token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: {
          include: { chronicDiseases: { include: { chronicDisease: true } } },
        },
        plans: true,
        progress: true,
        notifications: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found." });

    return res.status(200).json({
      message: "User data retrieved successfully.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        profile: user.profile,
        plans: user.plans,
        progress: user.progress,
        notifications: user.notifications,
      },
    });

  } catch (error) {
    console.error("GetUserData Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ------------------- Log Out -------------------
export const logOut = (req, res) => {
  try {
    res.clearCookie("auth_token", { httpOnly: true, secure: true, sameSite: "None", expires: new Date(0) });
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ------------------- Forgot Password (TEST VERSION) -------------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    console.log("DEBUG: ForgotPassword request for email:", email);
    console.log("DEBUG: User found in DB:", user ? "YES" : "NO");

    if (!user) {
      return res.status(200).json({
        message: "If the email exists, a reset code has been generated.",
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 دقيقة

    console.log("DEBUG: Generated reset code:", resetCode);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetCode, resetCodeExpires },
    });

    console.log("DEBUG: Reset code saved to database successfully.");

    return res.status(200).json({
      message: "Reset code generated successfully (TEST MODE).",
      code: resetCode,
      expiresIn: "15 minutes",
    });

  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ------------------- Verify Reset Code -------------------
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and code are required." });

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user || user.resetCode !== code || !user.resetCodeExpires || new Date() > user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid or expired reset code." });
    }

    return res.status(200).json({ message: "Code verified successfully." });

  } catch (error) {
    console.error("verifyResetCode error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ------------------- Reset Password -------------------
export const resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password) return res.status(400).json({ message: "Email, code and new password are required." });

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user || user.resetCode !== code || !user.resetCodeExpires || new Date() > user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid or expired reset code." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetCode: null, resetCodeExpires: null },
    });

    return res.status(200).json({ message: "Password has been reset successfully." });

  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};