import "./loadEnv.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./controllers/auth/Auth.Routes.js";
import diseasesRoutes from "./controllers/diseases/Diseases.Routes.js";
import mealRoutes from "./controllers/meal/Meal.Routes.js";
import usersRoutes from "./controllers/users/Users.Routes.js";
import planRoutes from "./controllers/plan/Plan.Routes.js";
import profileRoutes from "./controllers/profile/Profile.Routes.js";
import dashboardRoutes from "./controllers/dashboard/Dashboard.Routes.js";
import settingsRoutes from "./controllers/settings/Settings.Routes.js";
import notificationsRoutes from "./controllers/notifications/Notifications.Routes.js";
import chatRoutes from "./controllers/chat/Chat.Routes.js";

// Initialize scheduled background jobs
import "./jobs/cronJobs.js";

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   CORS CONFIGURATION
========================= */

const whitelist = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",

];


const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
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
app.use("/api/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/chat", chatRoutes);




app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running successfully \u{1F680}",
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
});
