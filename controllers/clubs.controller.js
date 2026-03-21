



import db from "../config/database.js";
import { loginUser } from "./user.controller.js";

/* =========================================================
   1. ADD NEW CLUB
   - Allowed Roles: Faculty, Administration
   ========================================================= */
const addClub = async (req, res) => {
    const role = req.session.role;

    if (role === "faculty" || role === "administration") {
        const { club_name, club_description, date_established } = req.body;

        if (!club_name || !club_description) {
            return res.status(400).json({ message: "Club name and description are required." });
        }

        try {
            const query = `
                INSERT INTO Clubs (club_name, club_description, date_established)
                VALUES ($1, $2, $3)
                RETURNING club_id, club_name
            `;
            const values = [club_name, club_description, date_established || new Date()];
            
            const result = await db.query(query, values);
            
            res.status(201).json({ 
                message: "Club added successfully", 
                club: result.rows[0] 
            });

        } catch (error) {
            console.error("Error adding club:", error);
            // Handle duplicate club name error (Postgres code 23505)
            if (error.code === '23505') {
                return res.status(400).json({ message: "A club with this name already exists." });
            }
            res.status(500).json({ message: "Database error" });
        }
    } else {
        res.status(403).json({ message: "Unauthorized: Only Faculty/Admin can add clubs." });
    }
};

/* =========================================================
   2. ADD POST (Announcement)
   - Allowed Roles: Administration
   - Allowed Emails: Specific list only
   ========================================================= */
const addPost = async (req, res) => {

    console.log("yuppp",req.params , req.body)
    const userEmail = req.session.userEmail;
    const role = req.session.role;

    // List of authorized emails (Update this list as needed)
    const allowedEmails = [
        "pixelro@rguktinfosnity.ac.in",
        "kaladharani@rguktinfosnity.ac.in",
        "artix@rguktinfosnity.ac.in",
        "techxcel@rguktinfosnity.ac.in",
        "icro@rguktinfosnity.ac.in",
        "khelsaathi@rguktinfosnity.ac.in",
        "sarvasrijana@rguktinfosnity.ac.in",
        "inauguration@rguktinfosnity.ac.in"
    ];

    // Check if user is admin AND email is in the allowed list
    if (role === "administration" && allowedEmails.includes(userEmail)) {
        const club_id = Number(req.params.club_id);

        const {post_title, post_content, link_url } = req.body;

        if (!club_id || !post_title) {
            return res.status(400).json({ message: "Club ID and Post Title are required." });
        }
        console.log("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",club_id,post_content,post_title,link_url);
        try {
            const query = `
                INSERT INTO posts (club_id, post_title, post_content, link_url)
                VALUES ($1, $2, $3, $4)
                RETURNING post_id, post_date
            `;
            const values = [club_id, post_title, post_content, link_url];

            await db.query(query, values);
            res.status(201).json({ message: "Post added successfully" });

        } catch (error) {
            console.error("Error adding post:", error);
            res.status(500).json({ message: "Failed to add post" });
        }

    } else {
        res.status(403).json({ message: "Unauthorized: You do not have permission to post updates." });
    }
};

/* =========================================================
   3. GET CLUBS (Public)
   ========================================================= */
const getClubs = async (req, res) => {
    try {
        // Order by ID so they don't jump around
        const result = await db.query("SELECT * FROM Clubs ORDER BY club_id ASC");
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Error fetching clubs:", error);
        res.status(500).json({ message: "Failed to fetch clubs" });
    }
};

/* =========================================================
   5. GET POSTS (Optional: Fetch posts for a specific club)
   ========================================================= */
const getClubPosts = async (req, res) => {
    const { club_id } = req.params;
    try {
        const query = "SELECT * FROM posts WHERE club_id = $1 ORDER BY post_date DESC";
        const result = await db.query(query, [club_id]);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Failed to fetch posts" });
    }
};

export { addClub, addPost, getClubs,  getClubPosts };