import express from "express";
import {
  getAllMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
} from "./Meal.Controller.js"; // هنا الملف اسمو صح

const router = express.Router();

// كل الroutes الخاصة بالوجبات
router.get("/", getAllMeals);          // جلب كل الوجبات
router.get("/:id", getMealById);       // جلب وجبة محددة
router.post("/", createMeal);          // إنشاء وجبة جديدة
router.put("/:id", updateMeal);        // تعديل وجبة موجودة
router.delete("/:id", deleteMeal);     // حذف وجبة

export default router;