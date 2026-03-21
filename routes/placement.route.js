

import { Router } from "express";
import multer from "multer";
import { 
    addPlacement, 
    onGoing, 
    upComing, 
    completedPlacements, 
    registerPlacement, 
    updateStatus, 
    selectedCandidates, 
    updateAttendance, 
    getAttendance, 
    sendmockInterviewRequest, 
    registeredStudents, 
    checkAppliedStatus, 
    userAppliedPlacements,
    resumeView
} from "../controllers/placement.controller.js";

// --- MULTER CONFIGURATION (Memory Storage) ---
// We use memoryStorage() to avoid creating any local 'uploads' folder.
const storage = multer.memoryStorage();

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
    fileFilter: (req, file, cb) => {
        // Restrict to PDF only for security and consistency
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed!"), false);
        }
    }
});

const router = Router();

// --- PLACEMENT MANAGEMENT ---
router.post("/addPlacement", addPlacement);
router.get("/ongoing", onGoing);
router.get("/upcoming", upComing);
router.get("/completed", completedPlacements);

// --- STUDENT REGISTRATION (Buffer to Cloudinary Stream) ---
// 'upload.single("resume")' populates req.file.buffer
router.post("/registerPlacement/:placement_id", upload.single("resume"), registerPlacement);

// --- STATUS & ATTENDANCE ---
router.post("/updateStatus", updateStatus);
router.get("/selectedCandidates", selectedCandidates);
router.post("/updateAttendance", updateAttendance);
router.get("/getAttendance", getAttendance);

// --- USER SPECIFIC ROUTES ---
router.get("/check-application-status/:placement_id", checkAppliedStatus);
router.get("/appliedPlacements", userAppliedPlacements);
router.post("/sendMockRequest/:mock_role", sendmockInterviewRequest);

// --- ADMIN / ANALYTICS ---
router.get("/registeredStudents/:placement_id", registeredStudents);

// --- RESUME ACCESS ---
router.get("/getResume/:idno/:placement_id", resumeView);

export default router;