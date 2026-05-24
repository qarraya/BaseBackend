import express from "express";
import {
  getAllMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
  seedMealsFromAPI,
} from "./Meal.Controller.js";

import { verifyAdmin } from "../../middleware/verifyAdmin.js";
import upload from "../../middleware/upload.js";

const router = express.Router();

// 1. المسارات العامة
router.get("/", getAllMeals);
router.get("/test", (req, res) => res.status(200).json({ status: "ok", message: "Meal Routes are active" }));
router.get("/:id", getMealById);

// 2. مسارات الأدمن (محمية)
router.get("/seed", verifyAdmin, seedMealsFromAPI); // أعدنا الحماية هنا
router.post("/", verifyAdmin, upload.single("image"), createMeal);
router.put("/:id", verifyAdmin, upload.single("image"), updateMeal);
router.delete("/:id", verifyAdmin, deleteMeal);

export default router;