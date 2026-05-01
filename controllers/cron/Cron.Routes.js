import express from "express";
import { triggerCron } from "./Cron.Controller.js";
const router = express.Router();
router.get("/trigger", triggerCron);
export default router;
