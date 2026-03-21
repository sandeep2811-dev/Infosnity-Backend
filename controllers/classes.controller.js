import db from "../config/database.js";
import { v2 as cloudinary } from 'cloudinary';

// 1. Create a New Class (Faculty Only)
export const createClass = async (req, res) => {
    const { className, studentEmails } = req.body;
    const facultyEmail = req.session.userEmail;

    try {
        // Insert class into academic_classes table
        const newClass = await db.query(
            "INSERT INTO academic_classes (class_name, faculty_email) VALUES ($1, $2) RETURNING *",
            [className, facultyEmail]
        );

        const classId = newClass.rows[0].id;

        // Add students to class_members table
        if (studentEmails && studentEmails.length > 0) {
            for (const email of studentEmails) {
                await db.query(
                    "INSERT INTO class_members (class_id, student_email) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    [classId, email]
                );
            }
        }

        res.json({ success: true, class: newClass.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json("Error creating class");
    }
};

// 2. Add Members to Existing Class
export const addMembersToClass = async (req, res) => {
    const { classId, studentEmails } = req.body;
    try {
        for (const email of studentEmails) {
            await db.query(
                "INSERT INTO class_members (class_id, student_email) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [classId, email]
            );
        }
        res.json({ success: true, message: "Students added" });
    } catch (err) {
        res.status(500).json("Error adding students");
    }
};

// 3. Get All Classes for Logged-in User (Faculty or Student)
export const getMyClasses = async (req, res) => {
    const userEmail = req.session.userEmail;
    try {
        const result = await db.query(
            `SELECT c.* FROM academic_classes c 
             LEFT JOIN class_members cm ON c.id = cm.class_id 
             WHERE c.faculty_email = $1 OR cm.student_email = $1
             GROUP BY c.id`,
            [userEmail]
        );
        res.json({ success: true, result: result.rows });
    } catch (err) {
        res.status(500).json("Error fetching classes");
    }
};

// 4. Get Chat History for a Specific Class
export const getClassMessages = async (req, res) => {
    const { classId } = req.params;
    try {
        const result = await db.query(
            "SELECT * FROM class_realtime_messages WHERE class_id = $1 ORDER BY send_time ASC",
            [classId]
        );
        console.log(result.rows);
        res.json({ success: true, result: result.rows });
        
    } catch (err) {
        res.status(500).json("Error fetching messages");
    }
};

// 5. Upload File to Cloudinary
export const uploadClassFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json("No file uploaded");

        // Helper to upload buffer to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: "infosinity_classes", resource_type: "auto" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        res.json({ 
            success: true, 
            file_url: result.secure_url, 
            file_type: result.resource_type === 'image' ? 'image' : 'file' 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json("Cloudinary upload failed");
    }
};


