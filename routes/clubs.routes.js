import express from "express";
import { Router } from "express";
import { 
    addClub, 
    getClubs, 
    addPost, 
    getClubPosts
} from "../controllers/clubs.controller.js";

const router = Router();

router.post("/addClub", addClub);
router.get("/getClubs", getClubs);
router.post("/addPost/:club_id", addPost);
router.get("/getPosts/:club_id", getClubPosts);
export default router;