import express from "express";
import {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getUserPlan
} from "./Plan.Controller.js";

const router = express.Router();

router.post("/", createPlan);       // Create (يحساب السعرات تلقائياً)
router.get("/", getPlans);          // Get All
router.get("/:id", getPlanById);    // Get One
router.get("/user/:userId", getUserPlan); // Get by User ID
router.put("/:id", updatePlan);     // Update
router.delete("/:id", deletePlan);  // Delete

export default router;