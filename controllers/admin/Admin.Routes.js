import express from "express";
import jwt from "jsonwebtoken";
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

const router = express.Router();

// 🔹 Inline Middleware for Admin Verification
const verifyAdmin = (req, res, next) => {
  let token = null;

  if (req.headers.authorization) {
    if (req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else {
      token = req.headers.authorization;
    }
  }

  if (!token && req.cookies?.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return res.status(403).json({ success: false, message: "You must be logged in." });
  }

  jwt.verify(token, process.env.JWT_SECRET || "SUPER_SECRET_KEY", (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired access token." });
    }

    if (!decoded?.id || decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    req.user = decoded;
    next();
  });
};

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
