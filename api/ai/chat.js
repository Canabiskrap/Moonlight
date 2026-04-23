export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not set' });
  }

  try {
    const systemPrompt = `
You are a professional AI prompt engineer.

Your task is to convert user ideas into high-quality image generation prompts.

You MUST follow this exact format:

MAIN_PROMPT: <write a detailed cinematic prompt>

NEGATIVE_PROMPT: <list of unwanted elements>

STYLE: <keywords like cinematic, 3D render, ultra realistic>

RULES:
- No explanations
- No extra text
- Follow the format exactly
- Always write in English
- Make the result highly detailed and visually rich
`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },

      ...(history || []).map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts?.[0]?.text || ''
      })),

      {
        role: 'user',
        content: `Idea: ${message}`
      }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.6,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(500).json({
        error: data.error?.message || 'Groq API error'
      });
    }

    const text = data.choices?.[0]?.message?.content || '';

    // 🔥 نحاول نفصل النتائج تلقائيًا
    const mainMatch = text.match(/MAIN_PROMPT:\s*(.*)/i);
    const negativeMatch = text.match(/NEGATIVE_PROMPT:\s*(.*)/i);
    const styleMatch = text.match(/STYLE:\s*(.*)/i);

    const result = {
      raw: text,
      main_prompt: mainMatch ? mainMatch[1].trim() : '',
      negative_prompt: negativeMatch ? negativeMatch[1].trim() : '',
      style: styleMatch ? styleMatch[1].trim() : ''
    };

    return res.status(200).json(result);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
