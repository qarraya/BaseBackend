import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ إنشاء transporter (أفضل إعداد لـ Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // لازم يكون App Password
  },
  logger: process.env.NODE_ENV === "development",
  debug: process.env.NODE_ENV === "development",
});

/**
 * إرسال OTP لاستعادة كلمة المرور
 * @param {string} email
 * @param {string} otp
 */
export const sendPasswordResetOTP = async (email, otp) => {
  try {
    // ✅ تحقق من الاتصال قبل الإرسال
    await transporter.verify();

    const mailOptions = {
      from: `"NutriFit Support" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: process.env.EMAIL_USER,

      subject: "رمز التحقق لاستعادة كلمة المرور | Password Reset OTP",

      // ✅ نسخة نصية (مهمة لتجنب spam)
      text: `
مرحباً،

رمز التحقق الخاص بك هو: ${otp}

هذا الرمز صالح لمدة 10 دقائق فقط.

إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.

NutriFit
      `,

      // ✅ HTML نظيف ومحسن
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; direction: rtl;">
          
          <h2 style="color: #e31e24; text-align: center;">NutriFit</h2>

          <p style="font-size: 16px; color: #333;">مرحباً،</p>

          <p style="font-size: 16px; color: #333;">
            لقد تلقينا طلباً لاستعادة كلمة المرور الخاصة بحسابك.
            يرجى استخدام رمز التحقق التالي:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <span style="
              font-size: 32px;
              font-weight: bold;
              color: #e31e24;
              letter-spacing: 6px;
              padding: 10px 20px;
              border: 2px dashed #e31e24;
              display: inline-block;
            ">
              ${otp}
            </span>
          </div>

          <p style="font-size: 14px; color: #666;">
            هذا الرمز صالح لمدة <strong>10 دقائق</strong> فقط.
          </p>

          <p style="font-size: 14px; color: #666;">
            إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد الإلكتروني بأمان.
          </p>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

          <p style="font-size: 12px; color: #999; text-align: center;">
            NutriFit &copy; 2026 - جميع الحقوق محفوظة
          </p>

        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ OTP email sent successfully to:", email);

  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
    throw new Error("Failed to send email. Please try again later.");
  }
};