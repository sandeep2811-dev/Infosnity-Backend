


import db from "../config/database.js";
import { loginUser } from "./user.controller.js";

// List of Authorities who can receive (from students) AND send (to students)
const authorityEmails = [
    "hodcse@rguktinfosnity.ac.in",
    "hodece@rguktinfosnity.ac.in",
    "hodeee@rguktinfosnity.ac.in",
    "hodmech@rguktinfosnity.ac.in",
    "hodcivil@rguktinfosnity.ac.in",
    "boyswarden@rguktinfosnity.ac.in",
    "girlswarden@rguktinfosnity.ac.in"
];

const sendRequest = async (req, res) => {
    const userEmail = req.session.userEmail;
    const role = req.session.role;
    const { toEmail, message } = req.body;

    if (!toEmail || !message) {
        return res.json({ message: false, error: "Recipient email and message are required" });
    }

    try {
        // --- CASE 1: SENDER IS AN AUTHORITY (HOD/Warden) ---
        // They are replying to a student. We allow them to send to ANYONE (Student ID/Email).
        if (authorityEmails.includes(userEmail)) {
            
            await db.query(
                "INSERT INTO grivence (fromemail, toemail, message) VALUES ($1, $2, $3)",
                [userEmail, toEmail, message]
            );
            return res.json({ message: true, sucessMessage: "Reply sent successfully" });
        }

        // --- CASE 2: SENDER IS A STUDENT ---
        // They can ONLY send to the specific Authority emails in the list.
        else {
            if (authorityEmails.includes(toEmail)) {
                await db.query(
                    "INSERT INTO grivence (fromemail, toemail, message) VALUES ($1, $2, $3)",
                    [userEmail, toEmail, message]
                );
                return res.json({ message: true, sucessMessage: "Request sent successfully" });
            } else {
                return res.json({ message: false, error: "Students can only message HODs or Wardens." });
            }
        }

    } catch (error) {
        console.error("Grievance Send Error:", error);
        return res.json({ message: false, error: "Database error while sending." });
    }
};

const getRequest = async (req, res) => {
    const userEmail = req.session.userEmail;
    try {
        // Fetch messages SENT TO the logged-in user (Inbox)
        const result = await db.query("SELECT * FROM grivence WHERE toemail=$1", [userEmail]);
        res.json({ message: true, result: result.rows });
    } catch (error) {
        console.log(error);
        res.json({ message: false, error: "Error fetching inbox" });
    }
};

const myRequests = async (req, res) => {
    const userEmail = req.session.userEmail;
    try {
        // Fetch messages SENT BY the logged-in user (Sent Items)
        const result = await db.query("SELECT * FROM grivence WHERE fromemail=$1", [userEmail]);
        res.json({ message: true, sucessMessage: "Fetched history", result: result.rows });
    } catch (error) {
        console.log(error);
        res.json({ message: false, error: "Error fetching sent history" });
    }
};

export { sendRequest, getRequest, myRequests };