import db from "../config/database.js";
import { loginUser } from "./user.controller.js";

// 1. Admin creates a community and adds students
export const createCommunity = async (req, res) => {
    const { name, studentEmails } = req.body; // studentEmails: ['s1@rgukt.ac.in', 's2@rgukt.ac.in']
    const adminEmail = req.session.userEmail;

    if (req.session.role !== "administration") {
        return res.status(403).json("Only admins can create communities");
    }

    try {
        const result = await db.query(
            "INSERT INTO communities (name, created_by) VALUES ($1, $2) RETURNING id",
            [name, adminEmail]
        );
        const communityId = result.rows[0].id;

        // Add admin and all selected students to membership table
        const members = [...studentEmails, adminEmail];
        for (const email of members) {
            await db.query("INSERT INTO community_members VALUES ($1, $2)", [communityId, email]);
        }
        res.json({ success: true, message: "Community Created" });
    } catch (err) {
        res.status(500).json("Database Error");
    }
};

// 2. Get list of communities I belong to
export const getMyCommunities = async (req, res) => {
    const email = req.session.userEmail;
    try {
        const result = await db.query(
            "SELECT c.id, c.name FROM communities c JOIN community_members cm ON c.id = cm.community_id WHERE cm.user_email = $1",
            [email]
        );
        res.json({ success: true, result: result.rows });
    } catch (err) {
        res.status(500).json("Error fetching groups");
    }
};

// 3. Send message to a specific community
export const sendCommunityMessage = async (req, res) => {
    const { communityId, message } = req.body;
    const fromEmail = req.session.userEmail;
    try {
        await db.query("INSERT INTO community_messages (community_id, fromemail, message) VALUES ($1, $2, $3)", 
        [communityId, fromEmail, message]);
        res.json({ success: true });
    } catch (err) { res.status(500).json("Error sending"); }
};

// 4. Get messages for a specific community
export const getCommunityMessages = async (req, res) => {
    const { communityId } = req.params;
    try {
        const result = await db.query("SELECT * FROM community_messages WHERE community_id = $1 ORDER BY created_at ASC", [communityId]);
        res.json({ success: true, result: result.rows });
    } catch (err) { res.status(500).json("Error fetching"); }
};

// Add new members to an existing group
export const addMembersToCommunity = async (req, res) => {
    const { communityId, studentEmails } = req.body; // Expects an array of emails
    const role = req.session.role;
    console.log("jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj",req.body);
    if (role !== "administration") {
        return res.status(403).json("Only admins can add members");
    }

    try {
        // We use a loop to insert each student
        // "ON CONFLICT DO NOTHING" prevents errors if a student is already in the group
        for (const email of studentEmails) {
            await db.query(
                "INSERT INTO community_members (community_id, user_email) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [communityId, email]
            );
        }
        res.json({ success: true, message: "Members added successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json("Error adding members");
    }
};