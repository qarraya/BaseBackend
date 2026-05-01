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
  listAllQuestions,
  answerQuestion,
  deleteQuestion,
  broadcastNotification
} from "./Admin.Management.Controller.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/register", adminRegister);

// Management
router.get("/stats", verifyAdmin, getAdminStats);
router.get("/questions/all", verifyAdmin, listAllQuestions);
router.post("/questions/:questionId/answer", verifyAdmin, answerQuestion);
router.delete("/questions/:questionId", verifyAdmin, deleteQuestion);
router.post("/broadcast", verifyAdmin, broadcastNotification);

router.get("/", verifyAdmin, listAdmins);
router.put("/:id", verifyAdmin, updateAdmin);
router.delete("/:id", verifyAdmin, deleteAdmin);

export default router;
