import { GoogleGenAI } from '@google/genai';
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export default async function handler(req, res) {
  if (!genAI) return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
  const { message, history, instruction } = req.body;
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        ...(history || []).map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: { systemInstruction: instruction, temperature: 0.7 }
    });
    res.json({ text: response.text });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
