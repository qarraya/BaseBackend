import express from "express";
import {
  adminLogin,
  adminRegister,
  updateAdminProfile,
  logoutAllSessions,
  toggleAdminActiveStatus,
  getAdminStats,
  listAllQuestions,
  answerQuestion,
  deleteQuestion,
  broadcastNotification,
  getNutritionalRules,
  upsertNutritionalRule,
  listAllUsers,
  toggleUserSubscription,
  listAdmins,
  deleteAdmin,
} from "./Admin.Controller.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

// Auth & Comprehensive Account Settings
router.post("/login", adminLogin);
router.post("/register", adminRegister);
router.put("/profile/:id", verifyAdmin, updateAdminProfile);

// Advanced Security Actions
router.post("/logout-all", verifyAdmin, logoutAllSessions);
router.patch("/toggle-status/:id", verifyAdmin, toggleAdminActiveStatus);

// Nutritional Rules (The "Brain")
router.get("/nutritional-rules", verifyAdmin, getNutritionalRules);
router.post("/nutritional-rules", verifyAdmin, upsertNutritionalRule);

// User Management
router.get("/users", verifyAdmin, listAllUsers);
router.patch("/users/:userId/subscription", verifyAdmin, toggleUserSubscription);

// Dashboard, Questions & Broadcast
router.get("/stats", verifyAdmin, getAdminStats);
router.get("/questions/all", verifyAdmin, listAllQuestions);
router.post("/questions/:questionId/answer", verifyAdmin, answerQuestion);
router.delete("/questions/:questionId", verifyAdmin, deleteQuestion);
router.post("/broadcast", verifyAdmin, broadcastNotification);

// Other Admins
router.get("/", verifyAdmin, listAdmins);
router.delete("/:id", verifyAdmin, deleteAdmin);

export default router;
