import express from "express";
import { createChronicDisease, deleteChronicDisease, getAllChronicDiseases, getChronicDiseaseById, updateChronicDisease, } from "./Diseases.Controller.js";
import { verifyAnyoneHasAccount } from "../../middleware/verifyToken.js";

const router = express.Router();

router.post("/", createChronicDisease);
router.get("/", getAllChronicDiseases); // Assuming this is the route to get all chronic diseases
router.get("/:id", getChronicDiseaseById);
router.put("/:id", updateChronicDisease);
router.delete("/:id", deleteChronicDisease);

export default router;