import express from "express";
const router = express.Router();

// Import the controller functions
import { 
    createCommunity, 
    getMyCommunities, 
    sendCommunityMessage, 
    getCommunityMessages,
    addMembersToCommunity
} from "../controllers/community.controller.js";

// --- Community Management ---

// POST: Admin creates a group and adds students
// URL: /api/v1/users/createCommunity
router.post("/createCommunity", createCommunity);

// GET: User fetches all groups they belong to
// URL: /api/v1/users/getMyCommunities
router.get("/getMyCommunities", getMyCommunities);

// --- Community Messaging ---

// POST: Send a message to a specific community
// URL: /api/v1/users/sendCommunityMsg
router.post("/sendCommunityMsg", sendCommunityMessage);

// GET: Fetch all messages for a specific group
// URL: /api/v1/users/getCommunityMessages/:communityId
router.get("/getCommunityMessages/:communityId", getCommunityMessages);

router.post("/addMembersToCommunity", addMembersToCommunity);
export default router;