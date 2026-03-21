// import express from "express";
// import { loginUser,registerFaculty,forgotPassword,updatePassword, logoutUser, } from "../controllers/user.controller.js";
// import { Router } from "express";
// import { sendMail,displayMail } from "../controllers/mail.controller.js";
// import { mentions ,retriveMentions } from "../controllers/mentions.controller.js";
// import { upload , uploadFile , getUserFiles ,downloadFile } from "../controllers/files.controller.js";    

// const router = Router();

// router.post("/login",loginUser);
// router.post("/update-password",updatePassword);
// router.post("/forgot-password",forgotPassword);
// router.post("/register",registerFaculty);
// router.get("/logout",logoutUser)
// router.post("/sendMail",sendMail);
// router.get("/displayMail",displayMail);
// router.post("/sendMention",mentions);
// router.get("/retriveMentions",retriveMentions);
// // router.post("/uploadFile", upload.single("file"), uploadFile);
// // router.post("/getFiles",getUserFiles);
// router.post("/upload", upload.single("file"), uploadFile);

// /* =========================
//    Get all files for the logged-in user
// ========================= */
// router.get("/files", getUserFiles);

// /* =========================
//    Download a file by Cloudinary public_id
//    - Forces download with original filename
// ========================= */
// router.get("/download/:public_id", downloadFile);

// export default router;






import express from "express";
import { loginUser, registerFaculty, forgotPassword, updatePassword, logoutUser, getAllUsers, getRealtimeMessages, checkAuth, getUnreadMessageCounts, markMessagesAsRead } from "../controllers/user.controller.js";
import { Router } from "express";
import { sendMail, displayMail, sentMails,markAsRead} from "../controllers/mail.controller.js";
import { mentions, retriveMentions } from "../controllers/mentions.controller.js";
import { upload, uploadFile, getUserFiles, downloadFile } from "../controllers/files.controller.js";

const router = Router();

router.post("/login", loginUser);
router.post("/update-password", updatePassword);
router.post("/forgot-password", forgotPassword);
router.post("/register", registerFaculty);
router.get("/logout", logoutUser);

router.post("/sendMail", sendMail);
router.get("/displayMail", displayMail);
router.get("/sentMails",sentMails);
router.put("/markAsRead", markAsRead);

// ✅ FIXED: Changed "/sendMention" to "/sendmention" to match frontend
router.post("/sendmention", mentions);

// ✅ FIXED: Changed "/retriveMentions" to "/retrieveMentions" to match frontend
router.get("/retrieveMentions", retriveMentions);

/* =========================
   File Upload Routes
========================= */
router.post("/upload", upload.single("file"), uploadFile);
router.get("/files", getUserFiles);
router.get("/download/:public_id", downloadFile);

// Get all users
router.get("/allusers", getAllUsers);

// Get realtime messages between two users
router.get("/realtimeMessages", getRealtimeMessages);

// Check authentication status (for session persistence)
router.get("/checkAuth", checkAuth);

// Get unread message counts for all conversations
router.get("/unreadMessageCounts", getUnreadMessageCounts);

// Mark messages as read for a conversation
router.post("/markMessagesAsRead", markMessagesAsRead);

export default router;