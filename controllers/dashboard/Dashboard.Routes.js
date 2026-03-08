import express from "express";
import { getDashboardToday } from "./Dashboard.Controller.js";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";

const router = express.Router();

router.get("/today", verifyAnyoneHasAccount, getDashboardToday);

export default router;
