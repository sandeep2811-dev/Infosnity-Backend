
import dotenv from "dotenv";
dotenv.config(); // MUST be first

import express from "express";
import db from "../config/database.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import axios from "axios";
import { loginUser } from "./user.controller.js";

const app = express();

/* =========================
   CLOUDINARY CONFIG
========================= */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/* =========================
   MULTER CONFIG (MEMORY)
========================= */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/* =========================
   UPLOAD FILE CONTROLLER
========================= */
const uploadFile = async (req, res) => {
    const role = req.session.role;

    if (role === "administration") {
        return res.json("Nothing To See Here...!!!");
    }

    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // ---- Upload to Cloudinary ----
        const cloudinaryResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "userfiles",
                    resource_type: "raw",
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

        // ---- Save file info in DB ----
        const query = `
            INSERT INTO userfiles
            (user_email, filename, filepath, filetype, public_id)
            VALUES ($1, $2, $3, $4, $5)
        `;

        await db.query(query, [
            req.session.userEmail,
            req.file.originalname,
            cloudinaryResult.secure_url,
            req.file.mimetype,
            cloudinaryResult.public_id
        ]);

        res.json({
            message: "File uploaded successfully",
            public_id: cloudinaryResult.public_id,
            filename: req.file.originalname
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

/* =========================
   GET USER FILES
========================= */
const getUserFiles = async (req, res) => {
    console.log("SESSION:", req.session);

    try {
        const result = await db.query("SELECT * FROM userfiles");
        res.json({
            message: "Files fetched (test)",
            sessionEmail: req.session.userEmail,
            files: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};





/* =========================
   DOWNLOAD FILE CONTROLLER
========================= */
const downloadFile = async (req, res) => {
  try {
    const { public_id } = req.params;
    
    // 🔴 REMOVED: const publicid = "userfiles/"+public_id;
    // ✅ FIXED: Use the public_id exactly as received (it already contains the folder)
    const publicid = public_id; 

    // Get the full public_id and original filename from DB
    const result = await db.query(
      "SELECT filename, public_id FROM userfiles WHERE public_id = $1",
      [publicid]
    );

    if (result.rowCount === 0) {
      console.log("File not found for ID:", publicid); // Added for debugging
      return res.status(404).send("File not found in database");
    }

    const { filename, public_id: cloudPublicId } = result.rows[0];

    // Generate Cloudinary download URL
    const url = cloudinary.url(cloudPublicId, {
      resource_type: "raw", // 'raw' covers pdf, doc, etc. Use 'image' or 'video' if specific.
      secure: true,
      // flags: "attachment" // Optional: Cloudinary can force download, but we handle it via stream below
    });

    // Fetch the file as a stream
    const response = await axios.get(url, { responseType: "stream" });

    // Set headers
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    
    // Pipe the stream to the client
    response.data.pipe(res);

  } catch (err) {
    console.error("Download Error:", err.message);
    res.status(500).send("Download failed");
  }
};



/* =========================
   EXPORTS
========================= */
export { upload, uploadFile, getUserFiles, downloadFile };
