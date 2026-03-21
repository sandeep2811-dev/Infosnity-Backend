


import express from "express";
import { Router } from "express";
import { 
    postBlog, 
    editBlog, 
    deleteBlog, 
    getAllBlogsWithUserBlogs 
} from "../controllers/blogs.controller.js"; // Adjust path if needed

const router = Router();

router.get("/getAllBlogs", getAllBlogsWithUserBlogs);
router.post("/postBlog", postBlog);
router.post("/editBlog/:blog_id", editBlog); // Uses POST as per your controller logic
router.delete("/deleteBlog/:blog_id", deleteBlog);

export default router;