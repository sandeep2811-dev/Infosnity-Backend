// routes/ai.routes.js (Create a 'routes' folder)

import express from 'express';
import { handleAIDoubt } from '../controllers/genai.controller.js'; // Note the .js extension

const router = express.Router();

// Define the POST route for the frontend to send chat messages
router.post('/ask-ai-doubt', handleAIDoubt);

export default router;