export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { query, products } = req.body;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `Based on query "${query}", recommend products from: ${JSON.stringify(products)}. Return JSON array of product names.` }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    res.json(JSON.parse(text));
  } catch (e) { res.status(500).json({ error: e.message }); }
}
