import express from "express";
import * as cronController from "../controllers/cron.controller.js";

const router = express.Router();

router.get("/breakfast", cronController.handleBreakfastReminder);
router.get("/lunch", cronController.handleLunchReminder);
router.get("/water", cronController.handleWaterReminder);
router.get("/snack", cronController.handleSnackReminder);
router.get("/dinner", cronController.handleDinnerReminder);
router.get("/subscriptions/expired", cronController.handleExpiredSubscriptions);
router.get("/subscriptions/near-expiry", cronController.handleNearExpirySubscriptions);

export default router;
