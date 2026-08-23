const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const generateWithOpenAI = async (prompt) => {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('OPENAI_API_KEY is not configured');
    error.status = 401;
    throw error;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: prompt,
      reasoning: { effort: 'low' },
      max_output_tokens: 900,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || `OpenAI request failed with status ${response.status}`);
    error.status = response.status;
    error.provider = 'openai';
    throw error;
  }

  const text = data.output_text || data.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === 'output_text')?.text;
  if (!text) throw new Error('OpenAI returned an empty response');
  return text.trim();
};

const generateWithGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.status = 401;
    throw error;
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const generated = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite', contents: prompt });
  if (!generated.text?.trim()) throw new Error('Gemini returned an empty response');
  return generated.text.trim();
};

router.use(verifyToken);

router.post('/chat', async (req, res) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > 2000) {
      return res.status(400).json({ success: false, message: 'Question must contain between 1 and 2,000 characters' });
    }

    const prompt = `You are Eduvo's study assistant. Give accurate, supportive educational guidance. Do not claim to diagnose emotions or mental health. Keep the answer concise and practical. Use this response structure when appropriate:\n\n### Answer\nA direct explanation.\n\n### Action plan\n- Clear steps the student can follow.\n\n### Check your understanding\nOne short reflective question.\n\nStudent: ${message}`;

    const provider = (process.env.AI_ASSISTANT_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : 'gemini')).toLowerCase();
    const responseText = provider === 'openai'
      ? await generateWithOpenAI(prompt)
      : await generateWithGemini(prompt);

    return res.json({ success: true, response: responseText });
  } catch (error) {
    console.error('Assistant API error:', error);
    const status = Number(error?.status || error?.code);
    const detail = String(error?.message || '').toLowerCase();
    if (status === 429 || detail.includes('quota') || detail.includes('rate limit')) {
      return res.status(429).json({ success: false, message: 'The AI request limit has been reached. Please wait briefly and try again.' });
    }
    if (status === 401 || status === 403 || detail.includes('api key')) {
      return res.status(503).json({ success: false, message: 'The AI provider credentials are missing or were rejected. Check OPENAI_API_KEY (or GEMINI_API_KEY) and restart the backend.' });
    }
    if (status === 404 || detail.includes('model')) {
      const provider = (process.env.AI_ASSISTANT_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : 'gemini')).toLowerCase();
      const model = provider === 'openai' ? (process.env.OPENAI_MODEL || 'gpt-5.6-luna') : (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite');
      return res.status(503).json({ success: false, message: `The configured ${provider} model is unavailable (current: ${model}).` });
    }
    if (detail.includes('fetch failed') || detail.includes('network') || detail.includes('enotfound') || detail.includes('timeout')) {
      return res.status(503).json({ success: false, message: 'The backend cannot reach the configured AI service. Check the internet connection, firewall or proxy, then try again.' });
    }
    return res.status(500).json({ success: false, message: 'The study assistant could not generate a response.' });
  }
});

module.exports = router;
