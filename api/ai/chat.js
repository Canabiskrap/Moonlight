export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, type } = req.body;

  if (!message || !type) {
    return res.status(400).json({ error: 'message and type are required' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not set' });
  }

  try {
    // 🔥 المرحلة 1: تحسين المدخلات (IMPORTANT)
    const improveRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Rewrite user input to be more detailed, professional, and clear."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const improveData = await improveRes.json();
    const improvedMessage =
      improveData.choices?.[0]?.message?.content || message;

    // 🎯 المرحلة 2: اختيار عقل الماكينة
    let systemPrompt = "";

    switch (type) {

      case "strategy":
        systemPrompt = `
You are a senior business strategist.

Return ONLY:

SWOT ANALYSIS:
- Strengths:
- Weaknesses:
- Opportunities:
- Threats:

TARGET AUDIENCE:
- Demographics:
- Pain Points:
- Goals:

ACTION PLAN:
- Step 1:
- Step 2:
- Step 3:
`;
        break;

      case "product":
        systemPrompt = `
You are a digital product expert.

Return ONLY:

PRODUCT NAME:
DESCRIPTION:
TARGET AUDIENCE:
UNIQUE SELLING POINT:
CONTENTS INCLUDED:
PRICING STRATEGY:
MARKETING PLAN:
`;
        break;

      case "digital_product":
        systemPrompt = `
You are a professional content creator.

Return:

TITLE:
TABLE OF CONTENTS:
CHAPTER 1:
CHAPTER 2:
CHAPTER 3:
CONCLUSION:
`;
        break;

      case "brand":
        systemPrompt = `
You are a branding expert.

Return:

BRAND NAME STYLE:
COLOR PALETTE (HEX):
TYPOGRAPHY:
LOGO STYLE:
VOICE & TONE:
VISUAL STYLE:
`;
        break;

      case "visual":
        systemPrompt = `
You are a creative director.

Return:

IDEA 1:
- Concept:
- Visual Style:
- Platform:
- Hook:

IDEA 2:
- Concept:
- Visual Style:
- Platform:
- Hook:
`;
        break;

      case "cv":
        systemPrompt = `
You are a professional resume writer.

Return:

NAME:
TITLE:
SUMMARY:
SKILLS:
EXPERIENCE:
EDUCATION:
PROJECTS:
`;
        break;

      case "template":
        systemPrompt = `
You are a document designer.

Return:

TEMPLATE TYPE:
STRUCTURE:
SECTIONS:
STYLE:
USAGE:
`;
        break;

      case "banana":
        systemPrompt = `
You are a crazy creative AI.

Return:

IDEA 1:
IDEA 2:
IDEA 3:
`;
        break;

      case "image":
        systemPrompt = `
You are a professional AI prompt engineer.

Example:

MAIN_PROMPT: A cinematic golden trophy glowing under moonlight, ultra realistic...
NEGATIVE_PROMPT: blurry, low quality, distorted text
STYLE: cinematic, 3D render, ultra detailed

Now follow same format.

Return ONLY:

MAIN_PROMPT:
NEGATIVE_PROMPT:
STYLE:
`;
        break;

      default:
        systemPrompt = "You are a helpful assistant.";
    }

    // 🚀 المرحلة 3: التوليد الاحترافي
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: improvedMessage }
        ],
        temperature: 0.6,
        max_tokens: 1200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data.error?.message || "Groq API error"
      });
    }

    const text = data.choices?.[0]?.message?.content || "";

    return res.status(200).json({
      type,
      improved_input: improvedMessage,
      result: text
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
