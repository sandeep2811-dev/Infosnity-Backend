import express from "express";
import { Router } from "express";

// Import from the correct file (placements.controller.js)
import { 
    addOffCampusAluminiDetails, 
    displayAlumins,
    // ... import other placement controllers ...
} from "../controllers/alumins.controller.js"

const router = Router();

// ... existing placement routes ...

// ✅ CRITICAL FIX: Changed to GET (Matches frontend apiClient.get)
router.get("/displayAlumins", displayAlumins);

// ✅ CRITICAL FIX: Spelling matches frontend exactly
router.post("/addOffCampusAluminiDetails", addOffCampusAluminiDetails);

export default router;