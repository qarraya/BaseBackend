import express from "express";
import {
  signUp,
  logIn,
  logOut,
  forgotPassword,
  verifyOTP,
  resetPassword,
  getUserData,
} from "./Auth.Controller.js";
import { adminLogin } from "../admin/Admin.Controller.js";

const router = express.Router();

router.post('/signup', signUp);//بتحدد وين يروح الطلب وبدونها السيرفر ما بعرف يعالج الطلب
router.post('/login', logIn);
router.post('/logout', logOut);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.get('/', getUserData);

// Admin routes
router.post('/admin/login', adminLogin);

export default router;
