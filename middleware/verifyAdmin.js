import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyAdmin = (req, res, next) => {
  let token = null;

  // 1. Check Authorization Header FIRST (to prioritize manual testing)
  if (req.headers.authorization) {
    if (req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else {
      token = req.headers.authorization;
    }
  }

  // 2. If no header, check cookies
  if (!token && req.cookies?.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return res.status(403).json({ message: "You must be logged in." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired access token." });
    }

    if (!decoded?.id || decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required." });
    }

    req.user = decoded;
    next();
  });
};
