import * as cronLogic from "../../jobs/cronJobs.js";

export const triggerCron = async (req, res) => {
  try {
    const isVercelCron = req.headers['x-vercel-cron'] === '1';
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET || "SUPER_SECRET_KEY";
    const isAuthorized = authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !isAuthorized) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const now = new Date();
    const currentHour = now.getUTCHours(); 

    switch (currentHour) {
      case 21: await cronLogic.handleSubscriptionExpiry(); break;
      case 5:  await cronLogic.sendMealReminder("وقت الفطور! 🍳", "خطتك لليوم جاهزة، ابدأ يومك بوجبة صحية ونشاط.", "Breakfast"); break;
      case 6:  await cronLogic.handleThreeDayWarning(); break;
      case 10: await cronLogic.sendMealReminder("وقت الغداء! 🥗", "لا تنسَ الالتزام بالكميات المحددة في خطتك لتعزيز طاقتك.", "Lunch"); break;
      case 11: await cronLogic.handleWaterReminder(); break;
      case 13: await cronLogic.sendMealReminder("وقت السناك! 🍏", "وجبة خفيفة ومفيدة لتجديد نشاطك في منتصف اليوم.", "Snack"); break;
      case 16: await cronLogic.sendMealReminder("وقت العشاء! 🌙", "ختام يومك بوجبة صحية خفيفة لتساعدك على نوم هادئ.", "Dinner"); break;
    }

    return res.status(200).json({ success: true, message: "Cron triggered", hour: currentHour });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
