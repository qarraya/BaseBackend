import express from "express";
import { createProfile, getAllProfiles, getProfile, updateProfile, deleteProfile } from "./Profile.Controller.js";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";

const router = express.Router();

router.post("/", verifyAnyoneHasAccount, createProfile);
router.get("/", getAllProfiles);
router.get("/:id", getProfile);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);

export default router;