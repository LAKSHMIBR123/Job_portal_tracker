import express from "express";
import { applyJob, testEmail } from "../controllers/applicationController.js";

const router = express.Router();

router.post("/apply", applyJob);
router.get("/test-email", testEmail);

export default router;
