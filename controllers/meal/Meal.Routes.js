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

router.get("/", getAllMeals);
router.get("/:id", getMealById);

router.post("/", verifyAdmin, upload.single("image"), createMeal);
router.put("/:id", verifyAdmin, upload.single("image"), updateMeal);
router.delete("/:id", verifyAdmin, deleteMeal);

export default router;