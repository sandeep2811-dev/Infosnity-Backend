

import { GoogleGenAI } from '@google/genai';
import { loginUser } from './user.controller.js';

// PASS THE API KEY EXPLICITLY HERE
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY
}); 

// A simple object to store conversation history keyed by user EMAIL now, not ID
const sessions = {}; 
const MODEL_NAME = "gemini-2.5-flash";

// ... rest of your controller code


export const handleAIDoubt = async (req, res) => {
    // 1. Identify the user using their email from the session
    const userEmail = req.session.userEmail;
    const { userMessage } = req.body; 

    if (!userEmail) {
        return res.status(401).json({ error: "User not logged in or session expired." });
    }

    try {
        // 2. Initialize or Retrieve the Chat Session (Memory)
        if (!sessions[userEmail]) {
            // Start a new chat session with system instructions
            sessions[userEmail] = ai.chats.create({
                model: MODEL_NAME,
                config: {
                    // System Instruction: Customize the AI's persona and rules
                    systemInstruction: `You are a helpful and brief AI assistant. Your purpose is to answer a wide variety of technical and general questions accurately and concisely.`,
                },
            });
            console.log(`New chat session created for user: ${userEmail}`);
        }

        const chat = sessions[userEmail];
        
        // 3. Send the message to the Gemini API
        const response = await chat.sendMessage({
            message: userMessage,
        });

        // 4. Send the AI's response back to the frontend
        res.json({
            reply: response.text,
        });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Failed to get AI response. Check API key and network connection." });
    }
};