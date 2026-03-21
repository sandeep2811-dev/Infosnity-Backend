import express from "express";
import { 
    createClass, 
    getMyClasses, 
    getClassMessages, 
    uploadClassFile,
    addMembersToClass 
} from "../controllers/classes.controller.js";
import { upload } from "../middlewares/upload.js"; // Your multer middleware

const router = express.Router();

router.post("/create", createClass);
router.post("/add-members", addMembersToClass);
router.get("/my-classes", getMyClasses);
router.get("/messages/:classId", getClassMessages);
router.post("/upload", upload.single("file"), uploadClassFile);

export default router;