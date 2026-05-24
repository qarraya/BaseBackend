import express from "express";
import {
  getAllMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
  seedMealsFromAPI,
} from "./Meal.Controller.js";

const router = express.Router();

// مسارات بدوووووووووون أي ميدلوير أو استيراد خارجي
router.get("/", getAllMeals);
router.get("/test", (req, res) => res.json({ message: "Test OK" }));
router.get("/:id", getMealById);
router.post("/", createMeal);
router.put("/:id", updateMeal);
router.delete("/:id", deleteMeal);

export default router;