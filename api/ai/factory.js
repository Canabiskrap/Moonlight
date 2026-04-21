export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { input, systemInstruction, responseSchema } = req.body;
  
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY is not set' });

  try {
    // Build schema instruction from responseSchema
    let schemaInstruction = '';
    if (responseSchema && responseSchema.properties) {
      const fields = Object.keys(responseSchema.properties).map(key => {
        const prop = responseSchema.properties[key];
        if (prop.type === 'array') return `"${key}": [array of strings]`;
        if (prop.type === 'object' && prop.properties) {
          const subFields = Object.keys(prop.properties).map(k => `"${k}": string`).join(', ');
          return `"${key}": {${subFields}}`;
        }
        return `"${key}": string`;
      }).join(', ');
      schemaInstruction = `\n\nIMPORTANT: Respond ONLY with a valid JSON object in this exact format: {${fields}}. No markdown, no explanation, just the JSON object.`;
    } else {
      schemaInstruction = '\n\nIMPORTANT: Respond with valid JSON only. No markdown, no explanation.';
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: (systemInstruction || 'You are a helpful assistant.') + schemaInstruction
          },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error?.message || 'Groq API error' });
    }

    const text = data.choices?.[0]?.message?.content || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    
    try {
      return res.json(JSON.parse(clean));
    } catch {
      return res.json({ text: clean, htmlContent: clean });
    }
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
}
