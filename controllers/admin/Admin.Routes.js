import express from "express";
import {
  adminLogin,
  adminRegister,
  listAdmins,
  updateAdmin,
  deleteAdmin,
} from "./Admin.Controller.js";
import {
  getAdminStats,
  listPendingQuestions,
  answerQuestion,
  broadcastNotification
} from "./Admin.Dashboard.Controller.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/register", adminRegister);

// Dashboard & Management
router.get("/stats", verifyAdmin, getAdminStats);
router.get("/questions/pending", verifyAdmin, listPendingQuestions);
router.post("/questions/:questionId/answer", verifyAdmin, answerQuestion);
router.post("/broadcast", verifyAdmin, broadcastNotification);

router.get("/", verifyAdmin, listAdmins);
router.put("/:id", verifyAdmin, updateAdmin);
router.delete("/:id", verifyAdmin, deleteAdmin);

export default router;
