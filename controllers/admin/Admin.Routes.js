import express from "express";
import {
  adminLogin,
  adminRegister,
  listAdmins,
  updateAdmin,
  deleteAdmin,
} from "./Admin.Controller.js";
import { verifyAdmin } from "../../middleware/verifyAdmin.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/register", adminRegister);

router.get("/", verifyAdmin, listAdmins);
router.put("/:id", verifyAdmin, updateAdmin);
router.delete("/:id", verifyAdmin, deleteAdmin);

export default router;
