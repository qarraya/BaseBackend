import express from "express";
import { getMyNotifications, getMyQuestions, getCurrentPlan } from "./Settings.Controller.js";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";

const router = express.Router();

router.get("/notifications", verifyAnyoneHasAccount, getMyNotifications);
router.get("/questions", verifyAnyoneHasAccount, getMyQuestions);
router.get("/plans/current", verifyAnyoneHasAccount, getCurrentPlan);

export default router;
