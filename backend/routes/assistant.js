const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Invalid messages format' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found. Using mock response.');
      // Return a mock response so the UI still works during testing
      return res.json({
        success: true,
        response: 'Hello! I am your mock AI assistant. Please configure your `GEMINI_API_KEY` in the backend `.env` file to enable real Gemini responses.'
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Simple handling: extract latest message content
    const prompt = messages[messages.length - 1].content || 'Hello';
    
    // We use gemini-3.5-flash as the default model
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      response: response.text
    });
  } catch (error) {
    console.error('Assistant API Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate response' });
  }
});

module.exports = router;
