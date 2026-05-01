import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

import prisma from "../lib/prisma.js";

export const verifyAdmin = (req, res, next) => {
  let token = null;

  if (req.headers.authorization) {
    token = req.headers.authorization.startsWith("Bearer ") 
      ? req.headers.authorization.split(" ")[1] 
      : req.headers.authorization;
  }

  if (!token && req.cookies?.auth_token) token = req.cookies.auth_token;

  if (!token) return res.status(403).json({ success: false, message: "You must be logged in." });

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: "Invalid or expired access token." });

    if (!decoded?.id || decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    // Real-time Security Check
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
    if (!admin || !admin.isActive) {
      return res.status(403).json({ success: false, message: "Account is inactive." });
    }

    if (admin.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }

    req.user = admin;
    next();
  });
};
