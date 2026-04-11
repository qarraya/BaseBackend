import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a password reset OTP to the user's email.
 * @param {string} email - Recipient email
 * @param {string} otp - The 6-digit OTP
 */
export const sendPasswordResetOTP = async (email, otp) => {
  const mailOptions = {
    from: `"NutriFit Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "رمز التحقق لاستعادة كلمة المرور | Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; direction: rtl;">
        <h2 style="color: #e31e24; text-align: center;">NutriFit</h2>
        <p style="font-size: 16px; color: #333;">مرحباً،</p>
        <p style="font-size: 16px; color: #333;">لقد تلقينا طلباً لاستعادة كلمة المرور الخاصة بحسابك. يرجى استخدام رمز التحقق التالي:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #e31e24; letter-spacing: 5px; padding: 10px 20px; border: 2px dashed #e31e24;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #666;">هذا الرمز صالح لمدة <strong>10 دقائق</strong> فقط.</p>
        <p style="font-size: 14px; color: #666;">إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد الإلكتروني بأمان.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;"> NutriFit &copy; 2026 - جميع الحقوق محفوظة</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send email. Please try again later.");
  }
};
