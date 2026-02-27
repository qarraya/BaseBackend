import express from "express";
import {
  signUp,
  logIn,
  logOut,
  sendVerificationCode,
  verifyAccount,
  forgotPassword,
  resetPassword,
  getUserData,
} from "./Auth.Controller.js";
const router = express.Router();

router.post('/', signUp);
router.post('/login', logIn);
router.post('/logout', logOut);
router.post('/sendVerificationCode', sendVerificationCode);
router.post('/verifyAccount', verifyAccount);
router.post('/forgotPassword', forgotPassword)
router.post('/resetPassword', resetPassword)
router.get('/', getUserData);

export default router;
