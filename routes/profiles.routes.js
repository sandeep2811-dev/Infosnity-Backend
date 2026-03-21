import express from "express";
import { Router } from "express";
import { 
    getLoggedUserDetails, 
    updateLoggedUserDetails 
} from "../controllers/profiles.controller.js"; // ✅ Check this path matches your file name

const router = Router();

// Matches: /api/v1/profile/getLoggedUserDetails
router.get("/getLoggedUserDetails", getLoggedUserDetails);

// Matches: /api/v1/profile/updateLoggedUserDetails
router.post("/updateLoggedUserDetails", updateLoggedUserDetails);

export default router;