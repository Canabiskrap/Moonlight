import { GoogleGenAI } from '@google/genai';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!genAI) {
    return res.status(500).json({ error: 'AI service not initialized. Add GEMINI_API_KEY.' });
  }

  const path = req.url;

  try {
    if (path.includes('/chat')) {
      const { message, history, instruction } = req.body;
      const response = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          ...(history || []).map((h) => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts: [{ text: message }] },
        ],
        config: { systemInstruction: instruction, temperature: 0.7 },
      });
      return res.json({ text: response.text });
    }

    if (path.includes('/insights')) {
      const { product } = req.body;
      const response = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: `Analyze this product and return JSON with creativeSummary, targetAudience, proTip, suggestedUseCases: ${JSON.stringify(product)}` }] }],
        config: { responseMimeType: 'application/json' },
      });
      return res.json(JSON.parse(response.text));
    }

    if (path.includes('/recommendations')) {
      const { query, products } = req.body;
      const response = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: `Based on query "${query}", recommend products from: ${JSON.stringify(products)}. Return JSON array of product names.` }] }],
        config: { responseMimeType: 'application/json' },
      });
      return res.json(JSON.parse(response.text));
    }

    if (path.includes('/factory')) {
      const { input, systemInstruction, responseSchema } = req.body;
      const response = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: input }] }],
        config: { systemInstruction, responseMimeType: 'application/json', responseSchema },
      });
      return res.json(JSON.parse(response.text));
    }

    if (path.includes('/image')) {
      const { prompt } = req.body;
      const response = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      return res.json({ text: response.text });
    }

    return res.status(404).json({ error: 'AI endpoint not found' });
  } catch (error) {
    console.error('AI Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
