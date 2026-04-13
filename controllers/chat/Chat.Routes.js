import express from "express";
import { postChat } from "./Chat.Controller.js";

const router = express.Router();

router.post("/", postChat);

export default router;
