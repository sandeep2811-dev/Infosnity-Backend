import express from "express";
import db from "../config/database.js";
import { loginUser } from "./user.controller.js";
import router from "../routes/user.route.js";


const mentions = async(req,res)=>{
        const {message} = req.body;
        console.log("succcccccccccccccccccccccccccccccccccccccccccccccc ypi &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&77");
        
        // Find all mentions
        const mentions = [...message.matchAll(/#([\w.+-]+@[\w.-]+\.\w+)/g)].map(m => m[1]); // extract only the email

        const toemails = mentions.join(",");

        // Remove mention tags from message
        const cleanMessage = message.replace(/#([\w.+-]+@[\w.-]+\.\w+)/g, "").trim();

        console.log("Mentions:", mentions);
        console.log("Original Message:", cleanMessage);

        const userEmail = req.session.userEmail;
        try{
            await db.query("insert into mentions values($1,$2,$3)",[userEmail,toemails,cleanMessage]);
            res.json("mentioned sucessfully");
        }
        catch{
            res.json("error in mentioning");
        }


}

// const retriveMentions = async (req, res) => {
//     const userEmail = req.session.userEmail;

//     if (!userEmail) {
//         return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     try {
//         // Pattern to find #email inside the message text
//         const mentionPattern = `%#${userEmail}%`;

//         const query = `
//             -- 1. Class Messages (8 columns total)
//             SELECT 
//                 id, 
//                 sender_email AS from_email, 
//                 message, 
//                 send_time AS timestamp, 
//                 'Class' AS source_type,
//                 class_id::text AS source_ref,
//                 file_url,
//                 file_type
//             FROM class_realtime_messages 
//             WHERE message LIKE $1

//             UNION ALL

//             -- 2. Community Messages (8 columns)
//             SELECT 
//                 id, 
//                 fromemail AS from_email, 
//                 message, 
//                 created_at AS timestamp, 
//                 'Community' AS source_type,
//                 community_id::text AS source_ref,
//                 NULL AS file_url,  -- Not in your community_messages columns
//                 NULL AS file_type
//             FROM community_messages 
//             WHERE message LIKE $1

//             UNION ALL

//             -- 3. Mails (8 columns)
//             SELECT 
//                 id, 
//                 fromemail AS from_email, 
//                 message, 
//                 created_at AS timestamp, 
//                 'Mail' AS source_type,
//                 toemail AS source_ref, -- Using toEmail as a reference for mails
//                 NULL AS file_url,
//                 NULL AS file_type
//             FROM mails 
//             WHERE message LIKE $1

//             UNION ALL

//             -- 4. HEC Messages (8 columns)
//             SELECT 
//                 message_id AS id, 
//                 fromemail AS from_email, 
//                 messages AS message, -- Your column name is 'messages'
//                 created_at AS timestamp, 
//                 'HEC' AS source_type,
//                 NULL AS source_ref,
//                 NULL AS file_url,
//                 NULL AS file_type
//             FROM hecmessages 
//             WHERE messages LIKE $1

//             ORDER BY timestamp DESC;
//         `;

//         const result = await db.query(query, [mentionPattern]);
//         console.log(result.rows)

//         res.json({
//             success: true,
//             message: "Mentions fetched successfully",
//             result: result.rows
//         });

//     } catch (err) {
//         console.error("Mention Retrieval Error:", err);
//         res.status(500).json({ success: false, message: "Error in fetching mentions" });
//     }
// };


const retriveMentions = async (req, res) => {
    const userEmail = req.session.userEmail;

    if (!userEmail) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const mentionPattern = `%#${userEmail}%`;

        const query = `
            -- 1. Class Messages Joined with academic_classes
            SELECT 
                crm.id, 
                crm.sender_email AS from_email, 
                crm.message, 
                crm.send_time AS timestamp, 
                'Class' AS source_type,
                ac.class_name AS source_name,
                crm.class_id::text AS source_ref,
                crm.file_url,
                crm.file_type
            FROM class_realtime_messages crm
            LEFT JOIN academic_classes ac ON crm.class_id = ac.id
            WHERE crm.message LIKE $1

            UNION ALL

            -- 2. Community Messages Joined with communities
            SELECT 
                cm.id, 
                cm.fromemail AS from_email, 
                cm.message, 
                cm.created_at AS timestamp, 
                'Community' AS source_type,
                c.name AS source_name,
                cm.community_id::text AS source_ref,
                NULL AS file_url,
                NULL AS file_type
            FROM community_messages cm
            LEFT JOIN communities c ON cm.community_id = c.id
            WHERE cm.message LIKE $1

            UNION ALL

            -- 3. Mails
            SELECT 
                id, 
                fromemail AS from_email, 
                message, 
                created_at AS timestamp, 
                'Mail' AS source_type,
                subject AS source_name, -- Use Subject as the "Name" for Mails
                toemail AS source_ref,
                NULL AS file_url,
                NULL AS file_type
            FROM mails 
            WHERE message LIKE $1

            UNION ALL

            -- 4. HEC Messages
            SELECT 
                message_id AS id, 
                fromemail AS from_email, 
                messages AS message, 
                created_at AS timestamp, 
                'HEC' AS source_type,
                'HEC Portal' AS source_name,
                NULL AS source_ref,
                NULL AS file_url,
                NULL AS file_type
            FROM hecmessages 
            WHERE messages LIKE $1

            ORDER BY timestamp DESC;
        `;

        const result = await db.query(query, [mentionPattern]);
        console.log(result.rows);

        res.json({
            success: true,
            message: "Mentions fetched successfully",
            result: result.rows
        });

    } catch (err) {
        console.error("Mention Retrieval Error:", err);
        res.status(500).json({ success: false, message: "Error fetching mentions" });
    }
};
export {mentions,retriveMentions};