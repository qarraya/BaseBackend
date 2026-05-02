import prisma from "../../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateUserPlan } from "../../utils/planGenerator.js";
import { createSystemNotification } from "../../utils/notificationService.js";
import { sendPasswordResetOTP } from "../../utils/mailService.js";

dotenv.config();

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
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          isVerified: true,
          isSubscribed: false,
          subscriptionEndDate: null,
          freePlansCount: 1, // Give 1 free plan generation instead of full subscription
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

    /* ------------------ Generate Automatic Plan ------------------ */
    try {
      await generateUserPlan(result.user.id);
    } catch (planError) {
      console.error("Automatic Plan Generation Failed on SignUp:", planError);
      // We don't block signup if plan generation fails, but we log it.
    }

    /* ------------------ Send Welcome Notification ------------------ */
    await createSystemNotification(
      result.user.id,
      "مرحباً بك في التطبيق! 🎉",
      "تم إنشاء حسابك بنجاح. نتمنى لك رحلة صحية موفقة.",
      "SUCCESS"
    );

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
      token: accessToken,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        isVerified: result.user.isVerified,
        createdAt: result.user.createdAt,
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

/* -------------------------------------------------------------------------- */
/*                          PASSWORD RECOVERY FLOW                            */
/* -------------------------------------------------------------------------- */

// 1. FORGOT PASSWORD - Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // 1. Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist." });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hash OTP with bcrypt
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 4. Save to DB with 10-min expiry
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode: hashedOtp,
        resetCodeExpires: expires,
      },
    });

    // 5. Send Email
    await sendPasswordResetOTP(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP has been sent to your email.",
    });
  } catch (error) {
    console.error("ForgotPassword Error (Full Stack):", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// 2. VERIFY OTP - Check if code is valid
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid request or OTP expired." });
    }

    // Check expiry
    if (new Date() > user.resetCodeExpires) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    // Compare hashed OTP
    const isMatch = await bcrypt.compare(otp, user.resetCode);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP code." });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified correctly. You can now reset your password.",
    });
  } catch (error) {
    console.error("VerifyOTP Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// 3. RESET PASSWORD - Finalize the reset
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid reset session." });
    }

    // Verify OTP again for security
    const isMatch = await bcrypt.compare(otp, user.resetCode);
    const isNotExpired = new Date() <= user.resetCodeExpires;

    if (!isMatch || !isNotExpired) {
      return res.status(400).json({ message: "OTP is invalid or expired." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user and clear reset fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    // Send notification
    await createSystemNotification(
      user.id,
      "تم تغيير كلمة المرور 🔐",
      "لقد قمت بتغيير كلمة المرور الخاصة بك بنجاح. إذا لم تكن أنت، يرجى مراجعة الدعم.",
      "SUCCESS"
    );

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now login.",
    });
  } catch (error) {
    console.error("ResetPassword Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
