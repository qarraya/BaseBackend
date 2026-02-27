import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer"; 

dotenv.config();

const prisma = new PrismaClient({
  log: ["error"],
});

export const signUp = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      gender,
      currentWeight,
      activityLevel,
      height,
      goal,
      chronicDiseasesIds, // optional array
    } = req.body

    /* ------------------ Required Fields Validation ------------------ */
    if (
      !username ||
      !email ||
      !password ||
      !gender ||
      currentWeight === undefined ||
      !activityLevel ||
      height === undefined ||
      !goal
    ) {
      return res.status(400).json({
        message: "All required fields must be provided.",
      });
    }

    /* ------------------ Check if Email Exists ------------------ */
   const existingUser = await prisma.user.findFirst({
  where: {
    OR: [
      { email: email },
      { username: username }
    ]
  }
});

    if (existingUser) {
      return res.status(400).json({
        message: "Email or username already exists.",
      });
    }

    /* ------------------ Hash Password ------------------ */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ------------------ Create User ------------------ */
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        gender,
        currentWeight: Number(currentWeight),
        activityLevel,
        height: Number(height),
        goal,
        isVerified: true,

        // Optional chronic diseases relation
        chronicDiseases:
          Array.isArray(chronicDiseasesIds) && chronicDiseasesIds.length > 0
            ? {
                create: chronicDiseasesIds.map((id) => ({
                  chronicDiseases: {
                    connect: { id: Number(id) },
                  },
                })),
              }
            : undefined,
      },
      include: {
        chronicDiseases: true,
      },
    });

    /* ------------------ Success Response ------------------ */
    return res.status(201).json({
      message: "User account created successfully.",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        gender: newUser.gender,
        currentWeight: newUser.currentWeight,
        activityLevel: newUser.activityLevel,
        height: newUser.height,
        goal: newUser.goal,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("SignUp Error:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const logIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    /* ------------------ Validation ------------------ */
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required.",
      });
    }

    /* ------------------ Find User ------------------ */
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        chronicDiseases: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found.",
      });
    }

    /* ------------------ Compare Password ------------------ */
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials.",
      });
    }

    /* ------------------ Generate JWT ------------------ */
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    /* ------------------ Set Cookie ------------------ */
    res.cookie("auth_token", accessToken, {
      httpOnly: true,
      secure: true,
       sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    /* ------------------ Success Response ------------------ */
    return res.status(200).json({
      message: "Login successful.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        gender: user.gender,
        currentWeight: user.currentWeight,
        activityLevel: user.activityLevel,
        height: user.height,
        goal: user.goal,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        chronicDiseases: user.chronicDiseases,
        accessToken:accessToken,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const getUserData = async (req, res) => {
  try {
    /* ------------------ Check Token ------------------ */
    if (!req.cookies || !req.cookies.auth_token) {
      return res.status(401).json({
        message: "Authentication token not found.",
      });
    }

    const token = req.cookies.auth_token;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired token.",
      });
    }

    /* ------------------ Get User ------------------ */
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        chronicDiseases: {
          include: {
            chronicDiseases: true,
          },
        },
        plans: true,
        progress: true,
        notifications: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    /* ------------------ Success Response ------------------ */
    return res.status(200).json({
      message: "User data retrieved successfully.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        gender: user.gender,
        currentWeight: user.currentWeight,
        activityLevel: user.activityLevel,
        height: user.height,
        goal: user.goal,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        chronicDiseases: user.chronicDiseases,
        plans: user.plans,
        progress: user.progress,
        notifications: user.notifications,
      },
    });
  } catch (error) {
    console.error("GetUserData Error:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const logOut = (req, res) => {
  try {
    /* ------------------ Clear Cookie ------------------ */
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      expires: new Date(0),
    });

    return res.status(200).json({
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

const verificationCodes = {};

export const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Account already verified.",
      });
    }

    /* Generate verification token (10 min) */
    const verificationToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_VERIFICATION_SECRET,
      { expiresIn: "10m" }
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verify-account?token=${verificationToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Account Verification",
      html: `
        <h3>Verify Your Account</h3>
        <p>Click the link below to verify your account:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>This link expires in 10 minutes.</p>
      `,
    });

    return res.status(200).json({
      message: "Verification email sent.",
    });
  } catch (error) {
    console.error("sendVerificationCode error:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const verifyAccount = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_VERIFICATION_SECRET
      );
    } catch (err) {
      return res.status(400).json({
        message: "Invalid or expired token.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Account already verified.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    return res.status(200).json({
      message: "Account verified successfully.",
    });
  } catch (error) {
    console.error("verifyAccount error:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const resetToken = jwt.sign(
        { id: user.id },
        process.env.JWT_RESET_SECRET,
        { expiresIn: "1h" }
      );

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Password Reset",
        html: `
          <h3>Password Reset</h3>
          <p>Click below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link expires in 1 hour.</p>
        `,
      });
    }

    return res.status(200).json({
      message: "If the email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    } catch (err) {
      return res.status(400).json({
        message: "Invalid or expired token.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};