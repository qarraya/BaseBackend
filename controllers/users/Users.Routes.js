
import express from "express";
import { createUser, getUsers, getUserById, updateUser, deleteUser } from "./Users.Controller.js";

const router = express.Router();

router.post("/", createUser);        // إنشاء مستخدم
router.get("/", getUsers);           // جلب كل المستخدمين
router.get("/:id", getUserById);     // جلب مستخدم بالـ id
router.put("/:id", updateUser);      // تعديل مستخدم
router.delete("/:id", deleteUser);   // حذف مستخدم

export default router;