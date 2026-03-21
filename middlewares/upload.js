import multer from "multer";
import path from "path";
import fs from "fs";

export const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});