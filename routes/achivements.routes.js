import express from "express";
import { Router } from "express";
import { addAchievement, getAchievements } from "../controllers/achivements.controller.js";

const router = Router();

// ✅ Make sure this is POST
router.post("/addAchivements", addAchievement);

// ✅ CHANGE THIS TO GET (It was likely POST before)
router.get("/getAchivements", getAchievements);

export default router;