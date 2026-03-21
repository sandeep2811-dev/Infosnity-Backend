import express from "express";
import db from "../config/database.js";

const loginUser = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const data = await db.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
        const data1 = await db.query("SELECT * FROM usersfaculty WHERE LOWER(email) = LOWER($1)", [email]);

        console.log("Users table result:", data.rows);
        console.log("UsersFaculty table result:", data1.rows);

        if (data.rows.length === 0 && data1.rows.length === 0) {
            return res.status(404).json("No user found");
        }

        else if (data.rows.length > 0 && data.rows[0].password === password && data.rows[0].role === role) {
            req.session.userEmail = email;
            req.session.user_id = data.rows[0].user_id;
            req.session.role = data.rows[0].role;
            
            return res.status(200).json({
                success: true,
                user: {
                    email,
                    role
                }
            });
        }

       else if (data1.rows.length > 0 && data1.rows[0].password === password && data1.rows[0].role === role) {
            req.session.userEmail = email;
            req.session.user_id = data1.rows[0].user_id;
            req.session.role = data1.rows[0].role;
            console.log(req.session.role);
            
            return res.status(200).json({
                success: true,
                user: {
                    email,
                    role
                }
            });
        }
        else{
        return res.json("Invalid password or role");
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json("Internal server error");
    }
};



const registerFaculty = async (req, res) => {
  const { name, dept, email, password , role } = req.body;

  try {

    const result = await db.query("SELECT email FROM usersfaculty WHERE email = $1", [email]);

    if (result.rows.length > 0) {
      return res.status(400).json({ message: "User already exists." });
    }


    await db.query(
      "INSERT INTO usersfaculty (name, dept, email, password,role) VALUES ($1, $2, $3, $4,$5)",
      [name, dept, email, password, role]
    );

    res.status(201).json({ message: "Registered successfully." });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};



const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const newPassword = "rgukt@123";
    
    console.log("Forgot Password Request for:", email); // Debugging Log

    try {
        // Update both tables
        const result1 = await db.query("UPDATE users SET password = $1 WHERE email = $2", [newPassword, email]);
        const result2 = await db.query("UPDATE usersFaculty SET password = $1 WHERE email = $2", [newPassword, email]);

        // Check if any row was actually updated
        if (result1.rowCount === 0 && result2.rowCount === 0) {
            return res.status(404).json({ message: "Email not found in our records" });
        }

        res.json({ message: `user password is ${newPassword}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "there is an internal error" });
    }
}


const updatePassword = async (req, res) => {
  const { oldPassword, newPassword, email } = req.body;

  try {
    // Check users table
    const userResult = await db.query("SELECT password FROM users WHERE email=$1", [email]);
    if (userResult.rows.length > 0) {
      if (userResult.rows[0].password !== oldPassword) {
        return res.status(400).json({ message: "Old password is incorrect." });
      }
      await db.query("UPDATE users SET password=$1 WHERE email=$2", [newPassword, email]);
      return res.json({ message: "Your password has been updated." });
    }

    // Check usersFaculty table
    const facultyResult = await db.query("SELECT password FROM usersFaculty WHERE email=$1", [email]);
    if (facultyResult.rows.length > 0) {
      if (facultyResult.rows[0].password !== oldPassword) {
        return res.status(400).json({ message: "Old password is incorrect." });
      }
      await db.query("UPDATE usersFaculty SET password=$1 WHERE email=$2", [newPassword, email]);
      return res.json({ message: "Your password has been updated." });
    }

    // Email not found in either table
    return res.status(404).json({ message: "User not found." });

  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


const getAllUsers = async (req, res) => {
    try {
        // Fetch users from both tables, excluding password
        // Use COALESCE to handle cases where name might be NULL
        const usersResult = await db.query(
            "SELECT user_id, email, role FROM users"
        );
        const facultyResult = await db.query(
            "SELECT user_id, email, role, name, dept FROM usersfaculty"
        );

        // Combine results - users table doesn't have name, so we'll use email prefix as fallback
        const allUsers = [
            ...usersResult.rows.map(user => ({ ...user, name: null, source: 'users' })),
            ...facultyResult.rows.map(user => ({ ...user, source: 'usersfaculty' }))
        ];

        res.json({
            success: true,
            data: allUsers
        });
    } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Save a realtime message (used by Socket.io)
const saveRealtimeMessage = async ({ fromemail, toemail, message, sendtime }) => {
    const result = await db.query(
        `INSERT INTO realtimemessages (fromemail, toemail, message, sendtime)
         VALUES ($1, $2, $3, COALESCE($4, NOW()))
         RETURNING *`,
        [fromemail, toemail, message, sendtime || null]
    );
    return result.rows[0];
};

// Fetch chat history between two users (both directions)
const getRealtimeMessages = async (req, res) => {
    const { fromEmail, toEmail } = req.query;
    if (!fromEmail || !toEmail) {
        return res.status(400).json({ success: false, message: "fromEmail and toEmail are required" });
    }
    try {
        const result = await db.query(
            `SELECT * FROM realtimemessages
             WHERE (fromemail = $1 AND toemail = $2)
                OR (fromemail = $2 AND toemail = $1)
             ORDER BY sendtime ASC`,
            [fromEmail, toEmail]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Get realtime messages error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Check if user is authenticated (for session persistence on page refresh)
const checkAuth = async (req, res) => {
    try {
        const email = req.session.userEmail;
        const role = req.session.role;

        if (!email || !role) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        // Return the same format as login response
        return res.status(200).json({
            success: true,
            user: {
                email,
                role
            }
        });
    } catch (error) {
        console.error("Check auth error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Mark messages as read for a conversation (called when user opens a conversation)
const markMessagesAsRead = async (req, res) => {
    try {
        const currentUserEmail = req.session.userEmail;
        const { fromEmail } = req.body;

        if (!currentUserEmail) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        if (!fromEmail) {
            return res.status(400).json({
                success: false,
                message: "fromEmail is required"
            });
        }

        // Get the latest message timestamp in this conversation
        const latestMsg = await db.query(
            `SELECT MAX(sendtime) as last_message_time
             FROM realtimemessages
             WHERE ((fromemail = $1 AND toemail = $2) OR (fromemail = $2 AND toemail = $1))`,
            [currentUserEmail, fromEmail]
        );

        const lastMessageTime = latestMsg.rows[0]?.last_message_time;

        if (lastMessageTime) {
            // Store the last read timestamp (we'll use a simple approach: store in a table)
            // First, try to create the table if it doesn't exist (handled gracefully)
            try {
                await db.query(`
                    CREATE TABLE IF NOT EXISTS message_read_status (
                        user_email VARCHAR(255),
                        other_user_email VARCHAR(255),
                        last_read_time TIMESTAMP,
                        PRIMARY KEY (user_email, other_user_email)
                    )
                `);
            } catch (tableError) {
                // Table might already exist, that's fine
            }

            // Upsert the last read timestamp
            await db.query(
                `INSERT INTO message_read_status (user_email, other_user_email, last_read_time)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_email, other_user_email)
                 DO UPDATE SET last_read_time = $3`,
                [currentUserEmail, fromEmail, lastMessageTime]
            );
        }

        return res.status(200).json({
            success: true,
            message: "Messages marked as read"
        });
    } catch (error) {
        console.error("Mark messages as read error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get unread message counts for all conversations
const getUnreadMessageCounts = async (req, res) => {
    try {
        const currentUserEmail = req.session.userEmail;

        if (!currentUserEmail) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        // Create table if it doesn't exist
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS message_read_status (
                    user_email VARCHAR(255),
                    other_user_email VARCHAR(255),
                    last_read_time TIMESTAMP,
                    PRIMARY KEY (user_email, other_user_email)
                )
            `);
        } catch (tableError) {
            // Table might already exist, that's fine
        }

        // Count messages sent TO the current user, but only those sent after the last read time
        const result = await db.query(
            `SELECT 
                m.fromemail,
                COUNT(*) as count
             FROM realtimemessages m
             LEFT JOIN message_read_status r 
                ON r.user_email = $1 
                AND r.other_user_email = m.fromemail
             WHERE m.toemail = $1
                AND (r.last_read_time IS NULL OR m.sendtime > r.last_read_time)
             GROUP BY m.fromemail`,
            [currentUserEmail]
        );

        // Convert to object format: { senderEmail: count }
        const unreadCounts = {};
        result.rows.forEach(row => {
            unreadCounts[row.fromemail] = parseInt(row.count);
        });

        return res.status(200).json({
            success: true,
            data: unreadCounts
        });
    } catch (error) {
        console.error("Get unread message counts error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export {loginUser,updatePassword,registerFaculty,forgotPassword,getAllUsers,saveRealtimeMessage,getRealtimeMessages,checkAuth,getUnreadMessageCounts,markMessagesAsRead}


// import db from "../config/database.js";

// /* =========================
//    LOGIN USER
// ========================= */
// // const loginUser = async (req, res) => {
// //     const { email, password, role } = req.body;
// //     console.log(req.body);

// //     try {
// //         const userResult = await db.query(
// //             "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
// //             [email]
// //         );

// //         const facultyResult = await db.query(
// //             "SELECT * FROM usersfaculty WHERE LOWER(email) = LOWER($1)",
// //             [email]
// //         );

// //         // No user in both tables
// //         if (userResult.rows.length === 0 && facultyResult.rows.length === 0) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: "No user found"
// //             });
// //         }

// //         // Student login
// //         if (
// //             userResult.rows.length > 0 &&
// //             userResult.rows[0].password === password &&
// //             userResult.rows[0].role === role
// //         ) {
// //             req.session.userEmail = email;
// //             req.session.role = role;

// //             return res.status(200).json({
// //                 success: true,
// //                 user: {
// //                     email,
// //                     role
// //                 }
// //             });
// //         }

// //         // Faculty login
// //         if (
// //             facultyResult.rows.length > 0 &&
// //             facultyResult.rows[0].password === password &&
// //             facultyResult.rows[0].role === role
// //         ) {
// //             req.session.userEmail = email;
// //             req.session.role = role;

// //             return res.status(200).json({
// //                 success: true,
// //                 user: {
// //                     email,
// //                     role
// //                 }
// //             });
// //         }

// //         return res.status(401).json({
// //             success: false,
// //             message: "Invalid email / password / role"
// //         });

// //     } catch (error) {
// //         console.error("Login error:", error);
// //         return res.status(500).json({
// //             success: false,
// //             message: "Internal server error"
// //         });
// //     }
// // };

// /* =========================
//    REGISTER FACULTY
// ========================= */
// const registerFaculty = async (req, res) => {
//     const { name, dept, email, password, role } = req.body;

//     try {
//         const result = await db.query(
//             "SELECT email FROM usersfaculty WHERE email = $1",
//             [email]
//         );

//         if (result.rows.length > 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "User already exists"
//             });
//         }

//         await db.query(
//             "INSERT INTO usersfaculty (name, dept, email, password, role) VALUES ($1, $2, $3, $4, $5)",
//             [name, dept, email, password, role]
//         );

//         res.status(201).json({
//             success: true,
//             message: "Registered successfully"
//         });

//     } catch (error) {
//         console.error("Registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// /* =========================
//    FORGOT PASSWORD
// ========================= */
// const forgotPassword = async (req, res) => {
//     const { email } = req.body;
//     const newPassword = "rgukt@123";

//     try {
//         await db.query(
//             "UPDATE users SET password = $1 WHERE email = $2",
//             [newPassword, email]
//         );

//         await db.query(
//             "UPDATE usersfaculty SET password = $1 WHERE email = $2",
//             [newPassword, email]
//         );

//         res.json({
//             success: true,
//             message: "Password reset successful",
//             newPassword
//         });

//     } catch (error) {
//         console.error("Forgot password error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

// /* =========================
//    UPDATE PASSWORD
// ========================= */
// const updatePassword = async (req, res) => {
//     const { oldPassword, newPassword, email } = req.body;

//     try {
//         const userResult = await db.query(
//             "SELECT password FROM users WHERE email = $1",
//             [email]
//         );

//         if (userResult.rows.length > 0) {
//             if (userResult.rows[0].password !== oldPassword) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Old password is incorrect"
//                 });
//             }

//             await db.query(
//                 "UPDATE users SET password = $1 WHERE email = $2",
//                 [newPassword, email]
//             );

//             return res.json({
//                 success: true,
//                 message: "Password updated successfully"
//             });
//         }

//         const facultyResult = await db.query(
//             "SELECT password FROM usersfaculty WHERE email = $1",
//             [email]
//         );

//         if (facultyResult.rows.length > 0) {
//             if (facultyResult.rows[0].password !== oldPassword) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Old password is incorrect"
//                 });
//             }

//             await db.query(
//                 "UPDATE usersfaculty SET password = $1 WHERE email = $2",
//                 [newPassword, email]
//             );

//             return res.json({
//                 success: true,
//                 message: "Password updated successfully"
//             });
//         }

//         return res.status(404).json({
//             success: false,
//             message: "User not found"
//         });

//     } catch (error) {
//         console.error("Update password error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Internal server error"
//         });
//     }
// };

/* =========================
   LOGOUT USER
========================= */
export const logoutUser = (req, res) => {
    try {
        // Since auth is stateless, just return success
        return res.json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// export {
//     loginUser,
//     registerFaculty,
//     forgotPassword,
//     updatePassword,
//     logoutUser
// };
