import express from "express";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";
import { getMyProgressHistory } from "./Progress.Controller.js";

const router = express.Router();

router.get("/me", verifyAnyoneHasAccount, getMyProgressHistory);

export default router;
