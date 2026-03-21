

import db from "../config/database.js";
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier'; // Ensure you run: npm install streamifier
import axios from "axios";
import https from "https";
import { loginUser } from "./user.controller.js";
import { log } from "console";


// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper: Increment placement counts
const incrementPlacementCount = async (placement_id, status) => {
    const columnMap = {
        "Applied": "applied_count",
        "Review": "review_count",
        "Offered": "offered_count",
        "Hired": "hired_count",
        "Interviewed": "interviewed_count"
    };
    const column = columnMap[status];
    if (!column) return;
    await db.query(
        `UPDATE placements SET ${column} = ${column} + 1 WHERE placement_id = $1`,
        [placement_id]
    );
};

// --- CONTROLLERS ---

const addPlacement = async (req, res) => {
    const userEmail = req.session.userEmail;
    if (userEmail !== "placementcell@rguktinfosnity.ac.in") {
        return res.status(403).json("Unauthorized");
    }

    let { company_name, applicant_role, role_description, start_date, end_date, job_type } = req.body;
    company_name = company_name?.toLowerCase();
    applicant_role = applicant_role?.toLowerCase();
    role_description = role_description?.toLowerCase();
    job_type = job_type?.toLowerCase();

    try {
        await db.query(
            `INSERT INTO placements 
            (company_name, role, role_description, start_date, end_date, job_type)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [company_name, applicant_role, role_description, start_date, end_date, job_type]
        );
        res.json("Successfully added placement");
    } catch (error) {
        console.error(error);
        res.status(500).json("Database error");
    }
};

const onGoing = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM placements WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`
        );
        res.json({ message: "Successfully fetched", data: result.rows });
    } catch (error) {
        res.status(500).json("Database error");
    }
};

const upComing = async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM placements WHERE start_date > CURRENT_DATE`);
        res.json({ message: "Successfully fetched", data: result.rows });
    } catch (error) {
        res.status(500).json("Database error");
    }
};

const completedPlacements = async (req, res) => {
    try {
        const result = await db.query(`SELECT * FROM placements WHERE end_date < CURRENT_DATE`);
        res.json({ message: "Successfully fetched", data: result.rows });
    } catch (error) {
        res.status(500).json("Database error");
    }
};




const registerPlacement = async (req, res) => {
    const userEmail = req.session.userEmail;
    console.log(userEmail);
    const idno = userEmail.split("@")[0];
    const role = req.session.role;
    const placement_id = req.params.placement_id;

    let { name, branch, sec , grad_year,file } = req.body;

    console.log("iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii",idno);
    
    name = name?.toLowerCase();
    branch = branch?.toLowerCase();

    if (role === "student") {
        try {
            if (!placement_id || isNaN(placement_id)) {
                return res.status(400).json("Invalid placement_id");
            }

            if (!req.file) {
                return res.status(400).json("No file uploaded.");
            }

            const ongoingCheck = await db.query(
                `SELECT placement_id FROM placements
                 WHERE placement_id = $1 AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`,
                [placement_id]
            );

            if (ongoingCheck.rows.length === 0) {
                return res.json("Registration allowed only for ongoing placements");
            }

            const alreadyRegisteredResult = await db.query(
                "SELECT * FROM registered_students WHERE idno=$1 AND placement_id=$2",
                [idno, placement_id]
            );

            if (alreadyRegisteredResult.rows.length > 0) {
                return res.json("You have already registered for this placement...");
            }

            // Upload directly to Cloudinary root
            const uploadToCloudinary = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: "raw",
                            format: "pdf",
                            public_id: `${idno}_${placement_id}_${Date.now()}`
                        },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );
                    streamifier.createReadStream(fileBuffer).pipe(stream);
                });
            };

            const cloudinaryResult = await uploadToCloudinary(req.file.buffer);

            await db.query(
                `INSERT INTO registered_students 
                (idno, placement_id, name, personal_email, branch, sec, resume_file_location, public_id,graduation_year) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9)`,
                [idno, placement_id, name, userEmail, branch, sec, cloudinaryResult.secure_url, cloudinaryResult.public_id,grad_year]
            );

            await incrementPlacementCount(placement_id, "Applied");
            res.json("Successfully registered for the placement");

        } catch (error) {
            console.error(error);
            res.json("Error in registering for this placement");
        }
    } else {
        res.json("You are not able to register");
    }
};


const resumeView = async (req, res) => {
    const { idno, placement_id } = req.params;

    console.log("777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777");
    console.log("6666666666666",idno,placement_id);
    
    

    try {
        // 1. Fetch the public_id from your database
        const result = await db.query(
            "SELECT public_id FROM registered_students WHERE idno = $1 AND placement_id = $2",
            [idno, placement_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json("Resume record not found.");
        }

        const publicId = result.rows[0].public_id;

        // 2. Generate a Signed URL
        // This bypasses the 401 error and tells the browser to open the file inline
        const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
            resource_type: "raw",
            type: "upload",
            attachment: false // 'false' ensures the browser opens it instead of downloading
        });

        // 3. Redirect to the signed URL
        // The browser will now have permission to load and show the PDF automatically
        res.redirect(signedUrl);

    } catch (err) {
        console.error("View Error:", err);
        res.status(500).send("Unable to open PDF. Please check your Cloudinary permissions.");
    }
};

const updateStatus = async (req, res) => {
    const userEmail = req.session.userEmail;
    if (userEmail !== "placementcell@rguktinfosnity.ac.in") return res.status(403).json("Unauthorized");

    const { ids, status, company_name, role, salary } = req.body;
    const idList = ids.split(",").map(i => i.trim());

    try {
        const query = `
            WITH target AS (SELECT placement_id FROM placements WHERE company_name = $1 AND role = $2),
            valid AS (SELECT rs.idno, rs.placement_id FROM registered_students rs JOIN target t ON rs.placement_id = t.placement_id WHERE rs.idno = ANY($3))
            UPDATE registered_students ps SET status = $4, package = $5 FROM valid v WHERE ps.idno = v.idno AND ps.placement_id = v.placement_id RETURNING ps.*;
        `;
        const result = await db.query(query, [company_name, role, idList, status, salary]);
        const pids = [...new Set(result.rows.map(r => r.placement_id))];
        for (const pid of pids) await incrementPlacementCount(pid, status);

        res.json({ message: "Status updated successfully", data: result.rows });
    } catch (err) {
        res.status(500).json("Update failed");
    }
};

const selectedCandidates = async (req, res) => {
    const userEmail = req.session.userEmail;
    if (!userEmail) return res.status(401).json("Unauthorized");
    try {
        const query = `SELECT rs.idno, rs.name,rs.status, rs.package, p.placement_id, p.company_name, p.job_type, p.role FROM registered_students rs JOIN placements p ON rs.placement_id = p.placement_id WHERE rs.status IN ('Offered', 'Hired')`;
        const result = await db.query(query);
        const packages = result.rows.map(r => parseFloat(r.package?.replace(/LPA/i, "")) || 0);
        res.json({
            data: result.rows,
            totalNumberOfSelected: result.rows.length,
            maxpackage: Math.max(...packages, 0) + " LPA",
            Internships: result.rows.filter(r => r.job_type?.toLowerCase() === "internship").length,
            Drives: result.rows.filter(r => r.job_type?.toLowerCase() !== "internship").length
        });
    } catch (error) {
        res.status(500).json("Database error");
    }
};

const updateAttendance = async (req, res) => {
    if (req.session.userEmail !== "placementcell@rguktinfosnity.ac.in") return res.status(403).json("Unauthorized");
    const { idnos, company_name, role, attendance, date } = req.body;
    try {
        const idList = idnos.split(",").map(x => x.trim());
        const pidResult = await db.query(`SELECT placement_id FROM placements WHERE company_name = $1 AND role = $2`, [company_name, role]);
        if (pidResult.rows.length === 0) return res.status(404).json("Placement not found");
        await db.query(`UPDATE registered_students SET attendance = $1, attendance_date = $2 WHERE idno = ANY($3) AND placement_id = $4`, [attendance, date, idList, pidResult.rows[0].placement_id]);
        res.json({ message: "Attendance updated" });
    } catch (err) {
        res.status(500).json("Server error");
    }
};

const getAttendance = async (req, res) => {
    try {
        const result = await db.query(`SELECT rs.*, p.company_name, p.role FROM registered_students rs JOIN placements p ON rs.placement_id = p.placement_id ORDER BY rs.idno;`);
        const filter = (branch, att) => result.rows.filter(s => s.branch?.toLowerCase() === branch && s.attendance?.toLowerCase() === att);
        res.json({
            result: result.rows,
            ecePresentedStudents: filter("ece", "present"),
            csePresentedStudents: filter("cse", "present"),
        });
    } catch (error) {
        res.status(500).json("Database error");
    }
};

const sendmockInterviewRequest = async (req, res) => {
    try {
        const userEmail = req.session.userEmail;
        if (req.session.role !== "student") return res.status(403).json("Unauthorized");
        const { mock_role } = req.params;
        const loggedInBatch = parseInt(userEmail.substring(1, 3), 10);

        const mailsResult = await db.query(`(SELECT rs.personal_email AS email FROM registered_students rs LEFT JOIN placements p ON rs.placement_id = p.placement_id WHERE rs.status = 'Hired' AND p.role = $1) UNION (SELECT email_id FROM offcampusalumins WHERE role_name = $1)`, [mock_role]);
        const emailString = mailsResult.rows
            .map(r => r.email)
            .filter(email => {
                const match = email?.match(/^o(\d{2})/i);
                return match ? parseInt(match[1], 10) < loggedInBatch : false;
            }).join(",");

        if (!emailString) return res.json("No hired candidates found.");
        await db.query(`INSERT INTO mockrequestmails (fromemail, toemail, subject, message) VALUES ($1, $2, $3, $4)`, [userEmail, emailString, "Mock Request", `Request for ${mock_role}`]);
        res.json("Registered for mock interview.");
    } catch (error) {
        res.status(500).json("Request failed");
    }
};

const registeredStudents = async (req, res) => {
    const { placement_id } = req.params;
    if (req.session.userEmail !== "placementcell@rguktinfosnity.ac.in") return res.status(403).json("Unauthorized");
    try {
        const result = await db.query("SELECT * FROM registered_students WHERE placement_id=$1", [placement_id]);
        res.json({ result: result.rows });
    } catch (error) {
        res.status(500).json("Database error");
    }
};

const getAllPlacements = async (req, res) => {
    if (req.session.userEmail !== "placement@rguktinfosnity.ac.in") return res.status(403).json("Unauthorized");
    try {
        const result = await db.query("SELECT * FROM placements ORDER BY start_date DESC");
        res.json({ data: result.rows });
    } catch (error) {
        res.status(500).json("Database error");
    }
};

const checkAppliedStatus = async (req, res) => {
    const userEmail = req.session.userEmail;
    if (!userEmail) return res.json({ applied: false });
    const { placement_id } = req.params;
    try {
        const result = await db.query("SELECT * FROM registered_students WHERE idno = $1 AND placement_id = $2", [userEmail.split("@")[0], placement_id]);
        res.json({ applied: result.rows.length > 0, status: result.rows[0]?.status || null });
    } catch (error) {
        res.status(500).json("Database error");
    }
};

const userAppliedPlacements = async (req, res) => {
    if (!req.session.userEmail) return res.status(401).json("Login required");
    try {
        const result = await db.query("SELECT rs.*, p.* FROM registered_students rs JOIN placements p ON rs.placement_id = p.placement_id WHERE rs.personal_email = $1", [req.session.userEmail]);
        res.json({ result: result.rows });
    } catch (error) {
        res.status(500).json("Error occured");
    }
};

export {
    addPlacement, onGoing, upComing, completedPlacements,
    registeredStudents, registerPlacement, updateStatus,
    selectedCandidates, updateAttendance, getAttendance,
    sendmockInterviewRequest, getAllPlacements, checkAppliedStatus,
    userAppliedPlacements, resumeView
};