import express from "express";
import { createChronicDisease, deleteChronicDisease, getChronicDiseaseById, updateChronicDisease, } from "./Diseases.Controller.js";

const router = express.Router();

router.post("/", createChronicDisease);
router.get("/:id", getChronicDiseaseById);
router.put("/:id", updateChronicDisease);
router.delete("/:id", deleteChronicDisease);

export default router;