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
      confirmPassword,
      gender,
      age,
      currentWeight,
      activityLevel,
      height,
      goal,
      chronicDiseasesIds, // optional array
    } = req.body

    /* ------------------ Required Fields Validation ------------------ */
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

    /* ------------------ Password Confirmation Check ------------------ */
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    /* ------------------ Check if Email Exists ------------------ */
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: "insensitive" } },
          { username: { equals: username, mode: "insensitive" } },
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email or username already exists.",
      });
    }

    /* ------------------ Hash Password ------------------ */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ------------------ Create User and Profile (Transaction) ------------------ */
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
          gender: gender || null,
          age: age ? Number(age) : null,
          height: height ? Number(height) : null,
          currentWeight: currentWeight ? Number(currentWeight) : null,
          goal: goal || null,
          activityLevel: activityLevel || null,
          chronicDiseases: {
            create: (chronicDiseasesIds && Array.isArray(chronicDiseasesIds))
              ? chronicDiseasesIds.map((id) => ({
                chronicDisease: {
                  connect: { id: Number(id) },
                },
              }))
              : [],
          },
        },
        include: {
          chronicDiseases: {
            include: {
              chronicDisease: true,
            },
          },
        },
      });

      return { user, profile };
    });

    /* ------------------ Generate JWT ------------------ */
    const accessToken = jwt.sign(
      {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        role: "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    /* ------------------ Set Cookie ------------------ */
    res.cookie("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    /* ------------------ Success Response ------------------ */
    return res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        isVerified: result.user.isVerified,
        createdAt: result.user.createdAt,
        profile: result.profile,
        accessToken: accessToken,
      },
    });
  } catch (error) {
    console.error("SignUp Error:", error);

    // Handle Prisma unique constraint errors (e.g., duplicate email/username)
    if (error.code === "P2002") {
      const field = error.meta?.target?.join(", ");
      return res.status(400).json({
        message: `Duplicate value for field: ${field}. Please use a different one.`,
      });
    }

    // Handle Prisma connect errors (e.g., disease ID doesn't exist)
    if (error.code === "P2025") {
      return res.status(400).json({
        message: "One or more Chronic Disease IDs provided do not exist in the database.",
      });
    }

    return res.status(500).json({
      message: "Internal server error.",
      error: error.message, // Helpful for debugging
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
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: "insensitive" } },
          { email: { equals: username, mode: "insensitive" } },
        ],
      },
      include: {
        profile: {
          include: {
            chronicDiseases: {
              include: {
                chronicDisease: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found.",
      });
    }
    console.log("Entered password:", password);
    console.log("Stored password:", user.password);

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
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    /* ------------------ Success Response ------------------ */
    return res.status(200).json({
      message: "Login successful.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        profile: user.profile,
        accessToken: accessToken,
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
        profile: {
          include: {
            chronicDiseases: {
              include: {
                chronicDisease: true,
              },
            },
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
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    console.log("DEBUG: ForgotPassword request for email:", email);
    console.log("DEBUG: User found in DB:", user ? "YES" : "NO");

    if (user) {
      // Generate a 6-digit numeric code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      console.log("DEBUG: Generated code:", resetCode);

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetCode,
            resetCodeExpires,
          },
        });
        console.log("DEBUG: Database updated successfully with reset code.");
      } catch (dbError) {
        console.error("DEBUG: Database update failed:", dbError);
        throw dbError; // Pass to main catch
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Password Reset Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
              <p>Hello,</p>
              <p>You requested to reset your password. Please use the following 6-digit code to proceed:</p>
              <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #4CAF50; border-radius: 5px; margin: 20px 0;">
                ${resetCode}
              </div>
              <p>This code is valid for <strong>15 minutes</strong>. If you did not request this, please ignore this email or contact support.</p>
              <p>Best regards,<br>Success App Team</p>
            </div>
          `,
        });
        console.log("DEBUG: Reset email sent successfully to:", user.email);
      } catch (mailError) {
        console.error("DEBUG: Mail sending failed:", mailError);
        // We don't throw here so we can still return 200, but we log the error
      }
    }

    // Always return success for security reasons (don't reveal if email belongs to a user)
    return res.status(200).json({
      message: "If the email exists, a 6-digit reset code has been sent.",
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and code are required.",
      });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user || user.resetCode !== code || !user.resetCodeExpires || new Date() > user.resetCodeExpires) {
      return res.status(400).json({
        message: "Invalid or expired reset code.",
      });
    }

    return res.status(200).json({
      message: "Code verified successfully.",
    });
  } catch (error) {
    console.error("verifyResetCode error:", error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({
        message: "Email, code and new password are required.",
      });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user || user.resetCode !== code || !user.resetCodeExpires || new Date() > user.resetCodeExpires) {
      return res.status(400).json({
        message: "Invalid or expired reset code.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null, // Clear the code after successful reset
        resetCodeExpires: null,
      },
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