import express from "express";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";
import { cancelSubscriptionDev, getMySubscriptionStatus, mockCheckout, startTrial } from "./Subscription.Controller.js";

const router = express.Router();

router.post("/cancel", verifyAnyoneHasAccount, cancelSubscriptionDev);
router.get("/me", verifyAnyoneHasAccount, getMySubscriptionStatus);
router.post("/mock-checkout", verifyAnyoneHasAccount, mockCheckout);
router.post("/start-trial", verifyAnyoneHasAccount, startTrial);

export default router;
