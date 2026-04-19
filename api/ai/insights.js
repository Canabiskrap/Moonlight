export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { product } = req.body;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `Analyze this product and return ONLY a JSON object with exactly these fields: creativeSummary (string), targetAudience (string), proTip (string), suggestedUseCases (array of strings). Product: ${JSON.stringify(product)}` }] }]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (e) { res.status(500).json({ error: e.message }); }
}
