export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { input, systemInstruction } = req.body;
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
          { role: 'system', content: systemInstruction || 'You are a helpful assistant. Respond with valid JSON only.' },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });
    const data = await response.json();
    if (!response.ok || data.error) return res.status(500).json({ error: data.error?.message || 'Groq API error' });
    const text = data.choices?.[0]?.message?.content || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    try {
      return res.json(JSON.parse(clean));
    } catch {
      return res.json({ text: clean });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
}
