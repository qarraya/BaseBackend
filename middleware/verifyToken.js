import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyAnyoneHasAccount = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(403).json({ message: "You must be logged in." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid or expired access token." });
        }

        if (decoded && decoded.id) {
            if (decoded.role === "user" || decoded.role === "admin") {
                req.user = decoded; // Attach decoded info to req.user
                next();
            } else {
                return res.status(403).json({ message: "Access denied. You should be logged in." });
            }
        } else {
            return res.status(401).json({ message: "Invalid token structure." });
        }
    });
};