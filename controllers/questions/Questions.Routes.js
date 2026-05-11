import express from "express";
import { askQuestion, getMyQuestions } from "./Questions.Controller.js";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";

const router = express.Router();

// All question routes require authentication
router.use(verifyAnyoneHasAccount);

router.get("/", getMyQuestions);
router.post("/", askQuestion);

export default router;
