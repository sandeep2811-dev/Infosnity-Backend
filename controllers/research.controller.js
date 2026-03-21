
import db from "../config/database.js";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import { upload } from "../middlewares/upload.js";
import { loginUser } from "./user.controller.js";

/* ================================
   CLOUDINARY CONFIG
================================ */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =========================================================
   1. CREATE PUBLICATION (CLOUDINARY ONLY)
   ========================================================= */
const createPublication = async (req, res) => {
    const userEmail = req.session.userEmail;
    const role = req.session.role;

    if (userEmail !== "rd@rguktinfosnity.ac.in" || role !== "administration") {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const { title, description, published_by, published_venue } = req.body;

        if (!title || !description || !published_by || !published_venue) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: "File is required" });
        }

        /* ---------- Upload to Cloudinary (Memory Only) ---------- */
        const cloudResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "publications",
                    resource_type: "raw",
                    use_filename: true,
                    unique_filename: true,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

        /* ---------- Save Metadata ---------- */
        const query = `
            INSERT INTO R_D_Publications
            (title, description, published_by, published_venue, file_location, public_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [
            title,
            description,
            published_by,
            published_venue,
            cloudResult.secure_url,
            cloudResult.public_id,
        ];

        const result = await db.query(query, values);

        res.status(201).json({
            message: "Publication added successfully",
            data: result.rows[0],
        });

    } catch (error) {
        console.error("❌ Create Publication Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/* =========================================================
   2. GET ALL PUBLICATIONS
   ========================================================= */
const getAllPublications = async (req, res) => {
    try {
        const query = `
            SELECT
                publication_id,
                title,
                description,
                published_by,
                published_venue,
                file_location,
                public_id
            FROM R_D_Publications
            ORDER BY publication_id DESC
        `;

        const result = await db.query(query);

        res.status(200).json({
            count: result.rowCount,
            data: result.rows,
        });

    } catch (error) {
        console.error("❌ Fetch Publications Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/* =========================================================
   3. DOWNLOAD PUBLICATION (CLOUDINARY STREAM)
   ========================================================= */
const downloadPublicationFile = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get the URL from the database
        const query = `
            SELECT file_location, title 
            FROM R_D_Publications 
            WHERE publication_id = $1
        `;
        const result = await db.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "File not found" });
        }

        const fileUrl = result.rows[0].file_location;
        const rawTitle = result.rows[0].title || "publication";
        
        // Clean the filename (remove special chars)
        const safeTitle = rawTitle.replace(/[^a-zA-Z0-9]/g, "_");
        const filename = `${safeTitle}.pdf`; // Assuming they are PDFs

        // 2. Fetch the file from Cloudinary as a stream
        const response = await axios({
            method: 'GET',
            url: fileUrl,
            responseType: 'stream' // <--- CRITICAL: Get it as a data stream
        });

        // 3. Set Headers to FORCE Download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', response.headers['content-type']);

        // 4. Pipe the stream directly to the user
        response.data.pipe(res);

    } catch (error) {
        console.error("❌ Download Error:", error);
        
        // Handle case where Cloudinary link is broken
        if (!res.headersSent) {
            res.status(500).json({ message: "Download failed or file invalid" });
        }
    }
};

/* ================================
   EXPORTS
================================ */
export {
    createPublication,
    getAllPublications,
    downloadPublicationFile,
};
