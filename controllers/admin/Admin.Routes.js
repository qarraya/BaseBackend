import express from "express";
import {
  adminLogin,
  adminRegister,
  getAdminStats,
  listAllQuestions,
  answerQuestion,
  deleteQuestion,
  broadcastNotification,
  listAdmins,
  updateAdmin,
  deleteAdmin,
} from "./Admin.Controller.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

// Auth
router.post("/login", adminLogin);
router.post("/register", adminRegister);

// Management (Stats & Questions)
router.get("/stats", verifyAdmin, getAdminStats);
router.get("/questions/all", verifyAdmin, listAllQuestions);
router.post("/questions/:questionId/answer", verifyAdmin, answerQuestion);
router.delete("/questions/:questionId", verifyAdmin, deleteQuestion);
router.post("/broadcast", verifyAdmin, broadcastNotification);

// Admin List Management
router.get("/", verifyAdmin, listAdmins);
router.put("/:id", verifyAdmin, updateAdmin);
router.delete("/:id", verifyAdmin, deleteAdmin);

export default router;
