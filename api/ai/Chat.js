export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, type } = req.body || {};

  if (!message || !type) {
    return res.status(400).json({
      error: "Missing message or type"
    });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: "Missing GROQ_API_KEY"
    });
  }

  try {
    let systemPrompt = "";

    // 🎯 أبسط نسخة مستقرة (بدون أي تعقيد)
    if (type === "image") {
      systemPrompt = `
You are an AI prompt engineer.

Return ONLY:

MAIN_PROMPT:
NEGATIVE_PROMPT:
STYLE:
`;
    } else if (type === "product") {
      systemPrompt = `
You are a digital product expert.

Return:

PRODUCT NAME:
DESCRIPTION:
`;
    } else {
      systemPrompt = `
You are a helpful assistant.
`;
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data.error?.message || "API error"
      });
    }

    const text = data.choices?.[0]?.message?.content || "";

    return res.status(200).json({
      result: text
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
