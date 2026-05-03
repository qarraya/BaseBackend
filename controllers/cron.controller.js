import * as cronService from "../services/cron.service.js";

const verifyCronSecret = (req) => {
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return false;
    }
    return true;
};

export const handleBreakfastReminder = async (req, res) => {
    if (!verifyCronSecret(req)) return res.status(401).json({ error: "Unauthorized" });
    try {
        const result = await cronService.sendMealReminder("وقت الفطور! 🍳", "خطتك لليوم جاهزة، ابدأ يومك بوجبة صحية ونشاط.", "Breakfast");
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleLunchReminder = async (req, res) => {
    if (!verifyCronSecret(req)) return res.status(401).json({ error: "Unauthorized" });
    try {
        const result = await cronService.sendMealReminder("وقت الغداء! 🥗", "لا تنسَ الالتزام بالكميات المحددة في خطتك لتعزيز طاقتك.", "Lunch");
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleWaterReminder = async (req, res) => {
    if (!verifyCronSecret(req)) return res.status(401).json({ error: "Unauthorized" });
    try {
        const result = await cronService.sendWaterReminder();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleSnackReminder = async (req, res) => {
    if (!verifyCronSecret(req)) return res.status(401).json({ error: "Unauthorized" });
    try {
        const result = await cronService.sendMealReminder("وقت السناك! 🍏", "وجبة خفيفة ومفيدة لتجديد نشاطك في منتصف اليوم.", "Snack");
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleDinnerReminder = async (req, res) => {
    if (!verifyCronSecret(req)) return res.status(401).json({ error: "Unauthorized" });
    try {
        const result = await cronService.sendMealReminder("وقت العشاء! 🌙", "ختام يومك بوجبة صحية خفيفة لتساعدك على نوم هادئ.", "Dinner");
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleExpiredSubscriptions = async (req, res) => {
    if (!verifyCronSecret(req)) return res.status(401).json({ error: "Unauthorized" });
    try {
        const result = await cronService.checkExpiredSubscriptions();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleNearExpirySubscriptions = async (req, res) => {
    if (!verifyCronSecret(req)) return res.status(401).json({ error: "Unauthorized" });
    try {
        const result = await cronService.checkNearExpirySubscriptions();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
