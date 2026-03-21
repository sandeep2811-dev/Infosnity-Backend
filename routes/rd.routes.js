import express from "express";
import { Router } from "express";

// Ensure this points to your actual controller file location
import { createPublication, downloadPublicationFile, getAllPublications } from "../controllers/research.controller.js"; 

// Import the upload middleware
import { upload } from "../middlewares/upload.js"; 

const router = Router();

// ✅ Matches Frontend: apiClient.get("/rd/getAllPublications")
router.get("/getAllPublications", getAllPublications);

// ✅ Matches Frontend: apiClient.post("/rd/createPublication", ...)
// Uses 'upload.single("file")' to handle the file upload
router.post("/createPublication", upload.single("file"), createPublication);
router.get('/download/:id', downloadPublicationFile);
export default router;