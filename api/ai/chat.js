export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not set' });
  }

  try {
    const systemPrompt = `
You are a professional AI prompt engineer specialized in creating high-quality prompts for AI image generation tools like Midjourney, Leonardo AI, and Stable Diffusion.

Your job:
- Transform simple ideas into cinematic, detailed, premium prompts
- Focus on lighting, materials, reflections, depth, atmosphere
- Make the result visually rich and realistic
- Always structure the output clearly

Return format:
1. Main Prompt
2. Negative Prompt
3. Style Keywords

Important:
- Do NOT explain anything
- Do NOT add extra الكلام
- Only return the structured result
`;

    const messages = [
      { role: 'system', content: systemPrompt },

      ...(history || []).map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts?.[0]?.text || ''
      })),

      {
        role: 'user',
        content: `Create a professional AI image prompt based on this idea:\n${message}`
      }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // 🔥 أقوى من 8b
        messages: messages,
        temperature: 0.85,
        max_tokens: 1200
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(500).json({
        error: data.error?.message || 'Groq API error'
      });
    }

    const text = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({ text });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
