import express from "express";
import {
  getAllMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
} from "./Meal.Controller.js"; // هنا الملف اسمو صح

import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

// كل الroutes الخاصة بالوجبات
router.get("/", getAllMeals);          // جلب كل الوجبات (متاح للجميع)
router.get("/:id", getMealById);       // جلب وجبة محددة (متاح للجميع)

// العمليات التالية مسموحة للأدمن فقط
router.post("/", verifyAdmin, createMeal);          // إنشاء وجبة جديدة
router.put("/:id", verifyAdmin, updateMeal);        // تعديل وجبة موجودة
router.delete("/:id", verifyAdmin, deleteMeal);     // حذف وجبة

export default router;