import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();

import authRoutes from "./controllers/auth/Auth.Routes.js";
import diseasesRoutes from "./controllers/diseases/Diseases.Routes.js";
import mealRoutes from "./controllers/meal/Meal.Routes.js";
import usersRoutes from "./controllers/users/Users.Routes.js";
import planRoutes from "./controllers/plan/Plan.Routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CORS CONFIGURATION
========================= */

// whitelist ممكن تضيف روابط الفرونت عندك هنا
const whitelist = [
  process.env.FRONTEND_URL,     // الرابط النهائي للفرونت على النت
  "http://localhost:5173",      // تطوير محلي
  "http://localhost:3000",      // تطوير محلي
];

// cors options مع السماح لكل origin بدون مشكلة للتطبيقات والموبايل
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (مثل Postman أو Flutter mobile)
    if (!origin) return callback(null, true);

    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      // بدل ما يرجع error يقدر يرجع false أو يسمح بكلشي للاختبار
      console.warn("Blocked by CORS:", origin);
      callback(null, true);  // ✅ السماح لأي origin
      // لو بدك تشدد الامان، استبدل السطر السابق ب:
      // callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));

/* =========================
   MIDDLEWARES
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/diseases", diseasesRoutes);
app.use("/api/meal", mealRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/plan", planRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running successfully 🚀",
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}
);