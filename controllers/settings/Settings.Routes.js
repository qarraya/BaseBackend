import express from "express";
import {
    getMyNotifications,
    getMyQuestions,
    getCurrentPlan,
    sendNotificationToUser,
    updateAccountSettings,
    getAccountSettings,
    createQuestion
} from "./Settings.Controller.js";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";

const router = express.Router();

router.get("/account", verifyAnyoneHasAccount, getAccountSettings);
router.get("/notifications", verifyAnyoneHasAccount, getMyNotifications);
router.post("/notifications/send", verifyAnyoneHasAccount, sendNotificationToUser);
router.get("/questions", verifyAnyoneHasAccount, getMyQuestions);
router.post("/questions", verifyAnyoneHasAccount, createQuestion);
router.get("/plans/current", verifyAnyoneHasAccount, getCurrentPlan);
router.put("/account", verifyAnyoneHasAccount, updateAccountSettings);

export default router;

