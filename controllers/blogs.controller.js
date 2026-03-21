import express from "express";
import db from "../config/database.js";
import { loginUser } from "./user.controller.js";

const postBlog = async (req, res) => {
    try {
        const {
            title,
            content,
            author_name
        } = req.body;
        const author_email= req.session.userEmail

        // Basic validation
        if (!title || !content || !author_name || !author_email) {
            return res.status(400).json({
                message: "title, content, author_name, and author_email are required"
            });
        }

        const query = `
            INSERT INTO blogs
            (title, content, author_name, author_email)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const values = [
            title,
            content,
            author_name,
            author_email
        ];

        const result = await db.query(query, values);

        res.status(201).json({
            message: "Blog posted successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Post Blog Error:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

const editBlog = async (req, res) => {
    try {
        const { blog_id } = req.params;
        const author_email = req.session.userEmail;

        if (!author_email) {
            return res.status(401).json({
                message: "Unauthorized: Please login"
            });
        }

        if (!blog_id) {
            return res.status(400).json({
                message: "blog_id is required"
            });
        }

        // Fields that are allowed to update
        const allowedFields = ["title", "content", "author_name", "status"];

        const updates = [];
        const values = [];
        let index = 1;

        // Build dynamic SET clause
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = $${index}`);
                values.push(req.body[field]);
                index++;
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                message: "No valid fields provided for update"
            });
        }

        // Add updated_at
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        // Final query
        const query = `
            UPDATE blogs
            SET ${updates.join(", ")}
            WHERE blog_id = $${index}
              AND author_email = $${index + 1}
            RETURNING *
        `;

        values.push(blog_id, author_email);

        const result = await db.query(query, values);

        if (result.rowCount === 0) {
            return res.status(403).json({
                message: "You are not allowed to edit this blog or blog not found"
            });
        }

        res.status(200).json({
            message: "Blog updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Edit Blog Error:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

const deleteBlog = async (req, res) => {
    try {
        const { blog_id } = req.params;
        const author_email = req.session.userEmail;

        // Auth check
        if (!author_email) {
            return res.status(401).json({
                message: "Unauthorized: Please login"
            });
        }

        // Validation
        if (!blog_id) {
            return res.status(400).json({
                message: "blog_id is required"
            });
        }

        const query = `
            DELETE FROM blogs
            WHERE blog_id = $1
              AND author_email = $2
            RETURNING *
        `;

        const result = await db.query(query, [blog_id, author_email]);

        // If no rows deleted → either not owner or blog doesn't exist
        if (result.rowCount === 0) {
            return res.status(403).json({
                message: "You are not allowed to delete this blog or blog not found"
            });
        }

        res.status(200).json({
            message: "Blog deleted successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Delete Blog Error:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

const getAllBlogsWithUserBlogs = async (req, res) => {
    try {
        const userEmail = req.session?.userEmail || null;

        const query = `
            SELECT
                blog_id,
                title,
                content,
                author_name,
                author_email,
                status,
                created_at,
                updated_at,
                CASE
                    WHEN author_email = $1 THEN true
                    ELSE false
                END AS is_owner
            FROM blogs
            ORDER BY created_at DESC
        `;

        const result = await db.query(query, [userEmail]);

        // Separate blogs (optional)
        const myBlogs = userEmail
            ? result.rows.filter(blog => blog.author_email === userEmail)
            : [];

        res.status(200).json({
            totalBlogs: result.rowCount,
            loggedInUser: userEmail,
            myBlogsCount: myBlogs.length,
            data: result.rows,
            myBlogs
        });

    } catch (error) {
        console.error("Fetch Blogs Error:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


export {postBlog,editBlog,deleteBlog,getAllBlogsWithUserBlogs};

