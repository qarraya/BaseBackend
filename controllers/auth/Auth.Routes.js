import express from "express";
import {
  signUp,
  logIn,
  logOut,
  //sendVerificationCode,
  //verifyAccount,
  getUserData,
} from "./Auth.Controller.js";
const router = express.Router();

router.post('/signup', signUp);
router.post('/login', logIn);
router.post('/logout', logOut);
//router.post('/sendVerificationCode', sendVerificationCode);
//router.post('/verifyAccount', verifyAccount);
router.get('/', getUserData);

export default router;
