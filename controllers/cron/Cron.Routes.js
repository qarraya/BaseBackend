import express from "express";
import { triggerCron } from "./Cron.Controller.js";

const router = express.Router();

// Public route but protected by x-vercel-cron header or Bearer secret
router.get("/trigger", triggerCron);

export default router;
