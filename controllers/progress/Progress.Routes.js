import express from "express";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";
import { getProgressDashboard } from "./Progress.Controller.js";

const router = express.Router();

router.get("/dashboard", verifyAnyoneHasAccount, getProgressDashboard);

export default router;
