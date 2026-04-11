import express from "express";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";

import {
    getMyNotifications,
    sendNotificationToUser,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from "./Notification.Controller.js";

const router = express.Router();

router.get("/", verifyAnyoneHasAccount, getMyNotifications);
router.patch("/mark-all-read", verifyAnyoneHasAccount, markAllNotificationsAsRead);
router.patch("/:id/read", verifyAnyoneHasAccount, markNotificationAsRead);
router.post("/send", verifyAnyoneHasAccount, sendNotificationToUser);

export default router;