import express from "express";
import db from "../config/database.js";
import { loginUser } from "./user.controller.js";

const   sendMail = async(req,res)=>{

    const {toEmail,subject,message} = req.body;

    const fromEmail = req.session.userEmail;
    console.log(fromEmail,"ooooooooooooooooooooooooooooooooooo");

    try{
        await db.query("insert into mails values($1,$2,$3,$4,$5)",[fromEmail,toEmail,subject,message,req.session.role]);
        res.json("mail sent sucessfully.");
    }catch(error){
        console.log(error);
        res.json("please try again later");
    }

}


// const displayMail = async (req, res) => {
//     const role = req.session.role;
//     const userEmail = req.session.userEmail;

//     console.log("Email:", userEmail);
//     console.log("Role:", role);

//     const role1 = "faculty";
//     const role2 = "administration";

//     if (role === "student") {
//         try {
//             const result = await db.query(
//                 "SELECT * FROM mails WHERE role =$1 OR role = $2 AND toemail LIKE 'o%' ORDER BY id DESC",
//                 [role1, role2]
//             );
//             const query = `
//             SELECT
//                 fromemail,
//                 subject,
//                 message
//             FROM
//                 mockrequestmails
//             WHERE
//                 -- Check all four possible positions for the email in the comma-separated string:
//                 toemail = $1                                -- Case 1: Exact match (only recipient)
//                 OR toemail LIKE $1 || ',%'                  -- Case 2: Match at the start (followed by a comma)
//                 OR toemail LIKE '%,' || $1                  -- Case 3: Match at the end (preceded by a comma)
//                 OR toemail LIKE '%,' || $1 || ',%';         -- Case 4: Match in the middle (surrounded by commas)
//         `;

//         const result2 = await db.query(query, [userEmail]);

//             console.log(result);
//             console.log(result2);
            
            
//             return res.json({ message: "Mails fetched successfully", result:result.rows,mockrequests:result2.rows });
//         } catch (err) {
//             console.error(err);
//             return res.json("There is an error in fetching mails");
//         }
//     }

//     if (role === "faculty") {
//         try {
//             const result = await db.query(
//                 "SELECT * FROM mails WHERE toemail = $1 order by id desc",
//                 [userEmail]
//             );
//             console.log(result.rows);
//             return res.json({ message: "Mails fetched successfully", result:result.rows });
//         } catch (err) {
//             console.error(err);
//             return res.json("There is an error in fetching mails");
//         }
//     }

//     if (role === "administration") {
//         try {
//             const result = await db.query(
//                 "SELECT * FROM mails WHERE toemail = $1 order by id desc",
//                 [userEmail]
//             );
//             return res.json({ message: "Mails fetched successfully", result:result.rows });
//         } catch (err) {
//             console.error(err);
//             return res.json("Error in fetching mails");
//         }
//     }

//         return res.json("Invalid user role");
// };

//     const role = req.session.role;
//     const userEmail = req.session.userEmail;

//     console.log("=== CONTROLLER START ===");
//     console.log("Current Session:", { role, userEmail });

//     // 1. Session Guard
//     if (!role || !userEmail) {
//         console.warn("DEBUG: No session found. User might be logged out.");
//         return res.status(401).json({ error: "Unauthorized: Please log in again." });
//     }

//     try {
//         // --- STUDENT ROLE LOGIC ---
//         if (role === "student") {
//             console.log("DEBUG: Running Student-specific queries...");

//             /** * FIX: We now look for:
//              * 1. Mails sent directly TO this student ($1)
//              * 2. OR General announcements from faculty/administration
//              */
//             const generalMailsQuery = `
//                 SELECT * FROM mails 
//                 WHERE toemail = $1 
//                    OR role = 'faculty' 
//                    OR role = 'administration'
//                 ORDER BY id DESC
//             `;

//             /** * FIX: Uses POSIX Regex (~) to find the email anywhere in a 
//              * comma-separated string, handling spaces and boundaries perfectly.
//              */
//             const mockMailsQuery = `
//                 SELECT fromemail, subject, message
//                 FROM mockrequestmails
//                 WHERE toemail ~ $1
//                 ORDER BY id DESC
//             `;

//             // Execute both queries in parallel for speed
//             const [generalResult, mockResult] = await Promise.all([
//                 db.query(generalMailsQuery, [userEmail]),
//                 db.query(mockMailsQuery, [`(^|,|\\s)${userEmail}($|,|\\s)`])
//             ]);

//             console.log(`DEBUG: Found ${generalResult.rows.length} general mails.`);
//             console.log(`DEBUG: Found ${mockResult.rows.length} mock request mails.`);
            
//             // Print the actual data to terminal for verification
//             if (generalResult.rows.length > 0) console.table(generalResult.rows);

//             return res.json({
//                 message: "Mails fetched successfully",
//                 result: generalResult.rows,
//                 mockrequests: mockResult.rows
//             });
//         }

//         // --- FACULTY & ADMINISTRATION LOGIC ---
//         if (role === "faculty" || role === "administration") {
//             console.log(`DEBUG: Running ${role} queries...`);

//             const result = await db.query(
//                 "SELECT * FROM mails WHERE toemail = $1 ORDER BY id DESC",
//                 [userEmail]
//             );

//             console.log(`DEBUG: Found ${result.rows.length} mails for ${userEmail}`);
//             if (result.rows.length > 0) console.table(result.rows);

//             return res.json({
//                 message: "Mails fetched successfully",
//                 result: result.rows
//             });
//         }

//         // Default case for undefined roles
//         console.error(`DEBUG: Unknown role detected: ${role}`);
//         return res.status(403).json({ error: "Invalid user role" });

//     } catch (err) {
//         console.error("!!! DATABASE ERROR !!!");
//         console.error("Message:", err.message);
//         return res.status(500).json({ error: "Internal server error while fetching mails" });
//     } finally {
//         console.log("=== CONTROLLER END ===");
//     }
// };
const displayMail = async (req, res) => {
    const role = req.session.role;
    const userEmail = req.session.userEmail;

    // console.log for debugging visibility
    console.log("--- Fetching Mails ---");
    console.log("User:", userEmail, "| Role:", role);

    if (!role || !userEmail) {
        return res.status(401).json({ error: "No session found" });
    }

    // STUDENT LOGIC
    if (role === "student") {
        try {
            const role1 = "faculty";
            const role2 = "administration";

            // FIX: Added parentheses around the roles so the 'o%' filter applies to BOTH.
            // Also ensured toemail = $3 so students see mails sent TO them specifically.
            const result = await db.query(
                `SELECT * FROM mails 
                 WHERE ((role = $1 OR role = $2) AND toemail LIKE 'o%') 
                 OR toemail = $3 
                 ORDER BY id DESC`,
                [role1, role2, userEmail]
            );

            const query = `
            SELECT fromemail, subject, message
            FROM mockrequestmails
            WHERE toemail = $1 
               OR toemail LIKE $1 || ',%' 
               OR toemail LIKE '%,' || $1 
               OR toemail LIKE '%,' || $1 || ',%'
            ORDER BY message DESC`;

            const result2 = await db.query(query, [userEmail]);

            console.log("Student Mails Found:", result.rows.length);
            console.log("Mock Mails Found:", result2.rows.length);
            
            return res.json({ 
                message: "Mails fetched successfully", 
                result: result.rows, 
                mockrequests: result2.rows 
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json("Error fetching student mails");
        }
    }

    // FACULTY & ADMINISTRATION LOGIC
    // Both roles follow the same rule: See mails sent to their specific email.
    if (role === "faculty" || role === "administration") {
        try {
            const result = await db.query(
                "SELECT * FROM mails WHERE toemail = $1 ORDER BY id DESC",
                [userEmail]
            );
            
            console.log(`${role} Mails Found:`, result.rows.length);
            
            return res.json({ 
                message: "Mails fetched successfully", 
                result: result.rows 
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json(`Error fetching ${role} mails`);
        }
    }

    return res.status(403).json("Invalid user role");
};

const sentMails = async(req,res)=>{
    const userEmail =req.session.userEmail;
    if(!userEmail){
        res.json("you first need to login");
    }
    try{
        const result = await db.query("select * from mails where fromemail=$1 order by id desc",[userEmail]);
        console.log(result.rows);
        res.json({message:true,result:result.rows});
    }catch(err){
        console.log(err);
        res.json("error occured");
    }
}

const markAsRead = async (req, res) => {
    const { mailId } = req.body;
    try {
        await db.query("UPDATE mails SET is_read = true WHERE id = $1", [mailId]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json("Error updating mail status");
    }
};

export { sendMail, displayMail, sentMails, markAsRead };
