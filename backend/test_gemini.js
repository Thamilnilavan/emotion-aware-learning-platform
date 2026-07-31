require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Hello',
    });
    console.log("Response text:", response.text);
  } catch (err) {
    console.error("Test Error:", err);
  }
}
test();
