export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { product } = req.body;
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY is not set' });
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a product analyst. Always respond with valid JSON only, no markdown, no explanation.'
          },
          {
            role: 'user',
            content: `Analyze this product and return ONLY a JSON object with exactly these fields: creativeSummary (string), targetAudience (string), proTip (string), suggestedUseCases (array of strings). Product: ${JSON.stringify(product)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    const data = await response.json();
    if (!response.ok || data.error) return res.status(500).json({ error: data.error?.message || 'Groq API error' });
    const text = data.choices?.[0]?.message?.content || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    return res.json(JSON.parse(clean));
  } catch (e) { res.status(500).json({ error: e.message }); }
}
