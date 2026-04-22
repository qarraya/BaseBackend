import express from "express";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";
import { getMyProgressHistory, getProgressDashboard } from "./Progress.Controller.js";

const router = express.Router();

router.get("/me", verifyAnyoneHasAccount, getMyProgressHistory);
router.get("/dashboard", verifyAnyoneHasAccount, getProgressDashboard);

export default router;
