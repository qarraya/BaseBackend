import express from "express";
import { createProfile, getAllProfiles, getProfile, updateProfile, deleteProfile } from "./Profile.Controller.js";

const router = express.Router();

router.post("/", createProfile);
router.get("/", getAllProfiles);
router.get("/:id", getProfile);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);

export default router;