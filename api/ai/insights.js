import { GoogleGenAI } from '@google/genai';
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export default async function handler(req, res) {
  if (!genAI) return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
  const { product } = req.body;
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Analyze this product and return JSON with creativeSummary, targetAudience, proTip, suggestedUseCases: ${JSON.stringify(product)}` }] }],
      config: { responseMimeType: 'application/json' }
    });
    res.json(JSON.parse(response.text));
  } catch (e) { res.status(500).json({ error: e.message }); }
}
