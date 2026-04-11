import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Sends a password reset OTP to the user's email.
 * @param {string} email - Recipient email
 * @param {string} otp - The 6-digit OTP
 */
export const sendPasswordResetOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"NutriFit Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "رمز التحقق لاستعادة كلمة المرور | Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; direction: rtl;">
          <h2 style="color: #e31e24; text-align: center;">NutriFit</h2>
          <p>مرحباً،</p>
          <p>رمز التحقق الخاص بك هو:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #e31e24;">${otp}</span>
          </div>
          <p>صالح لمدة 10 دقائق فقط.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send email");
  }
};