import express from "express";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";

import {
    getMyNotifications,
    sendNotificationToUser
} from "./Notification.Controller.js";

const router = express.Router();

router.get("/", verifyAnyoneHasAccount, getMyNotifications);
router.post("/send", verifyAnyoneHasAccount, sendNotificationToUser);

export default router;