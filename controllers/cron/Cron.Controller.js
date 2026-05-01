import * as cronLogic from "../../jobs/cronJobs.js";

/**
 * Vercel Cron Trigger:
 * This endpoint will be called by Vercel Cron Service.
 * It checks the current hour and runs the appropriate job.
 */
export const triggerCron = async (req, res) => {
  try {
    // Security check: Only allow Vercel or authorized requests
    // Vercel adds a header: x-vercel-cron: 1
    const isVercelCron = req.headers['x-vercel-cron'] === '1';
    const authHeader = req.headers['authorization'];
    
    // Fallback secret check if you want to test manually
    const cronSecret = process.env.CRON_SECRET || "SUPER_SECRET_KEY";
    const isAuthorized = authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !isAuthorized) {
      return res.status(401).json({ success: false, message: "Unauthorized cron trigger" });
    }

    const now = new Date();
    // Vercel servers are usually in UTC. 
    // We can use an offset or just check UTC hours. 
    // Let's assume the user wants UTC or provide a way to pass hour.
    const currentHour = now.getUTCHours(); 
    
    console.log(`Cron triggered at hour: ${currentHour} UTC`);

    let result = { task: "none", status: "skipped" };

    // Map UTC hours to tasks
    // Note: If user is in +3 (Jordan/KSA), then 8 AM local is 5 AM UTC.
    // Let's adjust based on +3 offset for simplicity or let it run.
    // For now, I'll provide a generic logic.
    
    // Task mapping (Example for UTC+3):
    // 00:00 local = 21:00 UTC (previous day)
    // 08:00 local = 05:00 UTC
    // 09:00 local = 06:00 UTC
    // 13:00 local = 10:00 UTC
    // 14:00 local = 11:00 UTC
    // 16:00 local = 13:00 UTC
    // 19:00 local = 16:00 UTC

    switch (currentHour) {
      case 21: // 00:00 Local
        await cronLogic.handleSubscriptionExpiry();
        result = { task: "Subscription Expiry", status: "done" };
        break;
      case 5: // 08:00 Local
        await cronLogic.sendMealReminder("وقت الفطور! 🍳", "خطتك لليوم جاهزة، ابدأ يومك بوجبة صحية ونشاط.", "Breakfast");
        result = { task: "Breakfast", status: "done" };
        break;
      case 6: // 09:00 Local
        await cronLogic.handleThreeDayWarning();
        result = { task: "3-Day Warning", status: "done" };
        break;
      case 10: // 13:00 Local
        await cronLogic.sendMealReminder("وقت الغداء! 🥗", "لا تنسَ الالتزام بالكميات المحددة في خطتك لتعزيز طاقتك.", "Lunch");
        result = { task: "Lunch", status: "done" };
        break;
      case 11: // 14:00 Local
        await cronLogic.handleWaterReminder();
        result = { task: "Water Reminder", status: "done" };
        break;
      case 13: // 16:00 Local
        await cronLogic.sendMealReminder("وقت السناك! 🍏", "وجبة خفيفة ومفيدة لتجديد نشاطك في منتصف اليوم.", "Snack");
        result = { task: "Snack", status: "done" };
        break;
      case 16: // 19:00 Local
        await cronLogic.sendMealReminder("وقت العشاء! 🌙", "ختام يومك بوجبة صحية خفيفة لتساعدك على نوم هادئ.", "Dinner");
        result = { task: "Dinner", status: "done" };
        break;
      default:
        // Run expiry check anyway if it's 21 UTC just in case
        break;
    }

    return res.status(200).json({
      success: true,
      message: "Cron trigger processed",
      ...result
    });

  } catch (error) {
    console.error("Cron Trigger Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
