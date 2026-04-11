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
const router = express.Router();

router.post('/signup', signUp);
router.post('/login', logIn);
router.post('/logout', logOut);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.get('/', getUserData);

export default router;
