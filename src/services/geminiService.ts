import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

export interface ProductInsight {
  creativeSummary: string;
  targetAudience: string;
  proTip: string;
  suggestedUseCases: string[];
}

export async function getProductInsights(product: any): Promise<ProductInsight> {
  if (!ai) throw new Error("AI service not initialized. Missing API Key.");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this product and provide creative insights in Arabic.
      Product Name: ${product.name}
      Description: ${product.description}
      Category: ${product.category}
      Price: $${product.price}`,
      config: {
        systemInstruction: "You are a creative marketing expert for 'Moonlight 🌕'. Your goal is to provide inspiring and professional insights about products in Arabic. Be concise, elegant, and persuasive.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            creativeSummary: { type: Type.STRING, description: "A short, inspiring summary of the product." },
            targetAudience: { type: Type.STRING, description: "Who would benefit most from this product." },
            proTip: { type: Type.STRING, description: "A professional tip for getting the most out of this product." },
            suggestedUseCases: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3-4 specific scenarios where this product is perfect."
            }
          },
          required: ["creativeSummary", "targetAudience", "proTip", "suggestedUseCases"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function getSmartRecommendations(query: string, products: any[]): Promise<string[]> {
  if (!ai) return [];
  try {
    const productList = products.map(p => ({ id: p.id, name: p.name, description: p.description, category: p.category }));
    
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: `User Query: "${query}"
      Available Products: ${JSON.stringify(productList)}`,
      config: {
        systemInstruction: "You are a smart shopping assistant. Based on the user's request, return a list of product IDs that best match their needs. If nothing matches, return an empty array. Return only the array of IDs.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}

export const generateImageWithGemini = async (prompt: string, aspectRatio: string = "1:1") => {
  if (!ai) throw new Error("AI service not initialized. Missing API Key.");
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

export async function chatWithBot(
  userMessage: string, 
  history: {role: 'user' | 'model', parts: {text: string}[]}[], 
  context: 'customer' | 'dashboard' = 'customer',
  settings?: any
): Promise<string> {
  if (!ai) {
    const hasKey = !!GEMINI_KEY;
    const errorMsg = "Gemini AI not initialized. API Key is " + (hasKey ? "present" : "MISSING");
    console.error(errorMsg);
    return `عذراً، هناك مشكلة في تهيئة الذكاء الاصطناعي (${hasKey ? 'مفتاح موجود ولكن فشل الاتصال' : 'مفتاح مفقود'}). يرجى التواصل مع الدعم الفني.`;
  }
  try {
    const persona = settings?.aiPersona || 'ceo';
    const brandDesc = settings?.brandDescription || '';
    const brandColors = settings?.brandColors?.join(', ') || '';

    let personaInstruction = "";
    if (persona === 'artist') {
      personaInstruction = "تحدث بنبرة فنية، ملهمة، وشاعرية. استخدم استعارات بصرية وجمالية.";
    } else if (persona === 'buddy') {
      personaInstruction = "تحدث بنبرة ودودة جداً، مرحة، وغير رسمية. استخدم الرموز التعبيرية بكثرة وكن كصديق مقرب.";
    } else {
      personaInstruction = "تحدث بنبرة رسمية، مباشرة، واحترافية جداً. ركز على النتائج والأعمال.";
    }

    const brandContext = brandDesc ? `معلومات عن العلامة التجارية: ${brandDesc}. الألوان المعتمدة: ${brandColors}.` : "";

    const customerInstruction = `أنت "المساعد الخبير" لـ Moonlight 🌕. أنت لست مجرد بوت، بل خبير في التصميم الرقمي والدعم الفني.
          ${personaInstruction}
          ${brandContext}
          
          قواعدك الذهبية:
          1. الهوية: اسمك "مساعد Moonlight 🌕 الذكي".
          2. الخبرة الفنية (إصلاحات المتجر):
             - إذا واجه العميل مشكلة في التحميل: أخبره أن يتأكد من استقرار الإنترنت، أو يراسلنا عبر واتساب لإرسال الملف يدوياً فوراً.
             - إذا سأل عن الدفع: أكد له أن PayPal وسيلة آمنة عالمياً، وبمجرد الدفع سيظهر زر "تحميل" تلقائياً.
             - إذا لم تظهر الصور: اطلب منه تحديث الصفحة (Refresh).
          3. خبرة المبيعات:
             - إذا كان العميل متردداً، اقترح عليه خدماتنا (لوجو، هوية بصرية، مواقع، تطبيقات).
             - اشرح له أن تصاميمنا "عصرية" و"تزيد من مبيعاته".
          4. التواصل:
             - كن ودوداً جداً واحترافياً.
             - لغتك هي العربية بلهجة مهذبة.
             - دائماً ذكّره بوجود أيقونة الواتساب الخضراء للتحدث مع الإدارة مباشرة لأي طلبات خاصة.
          
          معلومات المتجر:
          - نحن نقدم: تصميم شعارات، هوية بصرية، بوستات ريلز، مواقع ويب، تطبيقات أندرويد و iOS، ومعارض أعمال.
          - الأسعار: تنافسية جداً مقابل الجودة العالية.`;

    const dashboardInstruction = `أنت "المستشار الاستراتيجي الأعلى" لمتجر Moonlight 🌕. أنت خبير عالمي في التجارة الإلكترونية، التسويق الرقمي، وتحليل البيانات.
          ${personaInstruction}
          ${brandContext}
          
          دورك:
          مساعدة مالك المتجر (الإدارة) في اتخاذ قرارات استراتيجية، زيادة المبيعات، تحسين تجربة المستخدم، وابتكار أفكار تسويقية غير تقليدية.
          
          قواعدك الذهبية:
          1. التحليل العميق: لا تعطِ نصائح سطحية. اقرأ البيانات المقدمة لك واستخرج منها أنماطاً ورؤى دقيقة.
          2. الترويج والتسويق: اقترح حملات إعلانية، استراتيجيات تسعير (مثل العروض المجمعة، الخصومات المؤقتة)، وطرق لزيادة الـ Conversion Rate.
          3. الابتكار: اطرح أفكاراً لمنتجات أو خدمات جديدة تناسب هوية Moonlight (التصميم الرقمي، البرمجة، الهويات البصرية).
          4. النبرة: احترافية جداً، ملهمة، ومباشرة. استخدم لغة الأعمال والتسويق (ROI, Conversion, Retention) مع شرح مبسط باللغة العربية.
          5. الحلول العملية: أعطِ خطوات قابلة للتنفيذ (Actionable Steps) بدلاً من التنظير.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: context === 'dashboard' ? dashboardInstruction : customerInstruction,
        temperature: context === 'dashboard' ? 0.8 : 0.7,
        topP: 0.95,
      }
    });

    return response.text || "عذراً، لم أستطع فهم ذلك.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
}

export async function generateFixSuggestion(prompt: string): Promise<string> {
  if (!ai) throw new Error("AI service not initialized. Missing API Key.");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert developer. Provide concise, production-ready code fixes.",
      }
    });
    return response.text || "No fix suggestion available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function runFactoryMachine(machineId: string, input: string, imageUrl?: string, settings?: any): Promise<any> {
  if (!ai) throw new Error("AI service not initialized. Missing API Key.");
  
  const persona = settings?.aiPersona || 'ceo';
  const brandDesc = settings?.brandDescription || '';
  const brandColors = settings?.brandColors?.join(', ') || '';

  let personaInstruction = "";
  if (persona === 'artist') {
    personaInstruction = "تحدث بنبرة فنية، ملهمة، وشاعرية. استخدم استعارات بصرية وجمالية.";
  } else if (persona === 'buddy') {
    personaInstruction = "تحدث بنبرة ودودة جداً، مرحة، وغير رسمية. استخدم الرموز التعبيرية بكثرة وكن كصديق مقرب.";
  } else {
    personaInstruction = "تحدث بنبرة رسمية، مباشرة، واحترافية جداً. ركز على النتائج والأعمال.";
  }

  const brandContext = brandDesc ? `معلومات عن العلامة التجارية: ${brandDesc}. الألوان المعتمدة: ${brandColors}.` : "";

  let systemInstruction = "";
  let responseSchema: any = {};
  let contents: any = input;

  if (imageUrl) {
    contents = {
      role: 'user',
      parts: [
        { text: input },
        { text: `Image URL: ${imageUrl}` }
      ]
    };
  }

  if (machineId === 'strategy') {
    systemInstruction = `You are a world-class marketing strategist for 'Moonlight 🌕'. ${personaInstruction} ${brandContext} Analyze the user's business idea and provide a SWOT analysis and a Buyer Persona in Arabic.`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        swot: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
            threats: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["strengths", "weaknesses", "opportunities", "threats"]
        },
        persona: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            needs: { type: Type.STRING },
            painPoints: { type: Type.STRING }
          },
          required: ["name", "needs", "painPoints"]
        }
      },
      required: ["swot", "persona"]
    };
  } else if (machineId === 'product') {
    systemInstruction = `You are a digital product creator for 'Moonlight 🌕'. ${personaInstruction} ${brandContext} Convert a simple idea into a full product proposal in Arabic, including a catchy title, persuasive description, marketing plan, and price suggestion.`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        marketingPlan: { type: Type.STRING },
        priceSuggestion: { type: Type.STRING }
      },
      required: ["title", "description", "marketingPlan", "priceSuggestion"]
    };
  } else if (machineId === 'contentMaker') {
    systemInstruction = `You are an expert digital product creator and author for 'Moonlight 🌕'. ${personaInstruction} ${brandContext} The user wants to create a complete digital product (like an e-book, guide, article, or code snippet) based on their idea. Write the FULL content for this product in Arabic. Format the output ENTIRELY in clean HTML (using <h1>, <h2>, <p>, <ul>, <li>, <strong>, etc.). Do not use markdown, only HTML. Make it comprehensive, engaging, and ready to be sold or published.`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        htmlContent: { type: Type.STRING, description: "The full generated content formatted in HTML" }
      },
      required: ["htmlContent"]
    };
  } else if (machineId === 'brandGuidelines') {
    systemInstruction = `You are an expert Brand Identity Designer and Strategist for 'Moonlight 🌕'. ${personaInstruction} ${brandContext} The user will provide a brand name, industry, and personality. Generate a comprehensive 'Brand Guidelines' (دليل الهوية البصرية) document in Arabic. Include: Brand Story & Vision, Logo Usage rules, Color Palette (with HEX/RGB codes), Typography recommendations, and Tone of Voice. Format the output ENTIRELY in clean HTML (using <h1>, <h2>, <p>, <ul>, <li>, <strong>, and inline styles for color swatches if possible). Do not use markdown, only HTML.`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        htmlContent: { type: Type.STRING, description: "The full generated brand guidelines formatted in HTML" }
      },
      required: ["htmlContent"]
    };
  } else if (machineId === 'brandBook') {
    systemInstruction = `You are the 'Brand Book Architect' for 'Moonlight 🌕'. ${personaInstruction} ${brandContext} The user will provide a brand name, industry, description, and optionally links to their logo or existing assets. Your task is to analyze these inputs and generate a comprehensive, professional 'Brand Book' (دليل الهوية البصرية) document in Arabic. Include: Brand Story & Vision, Logo Usage rules, Color Palette (with HEX/RGB codes), Typography recommendations, and Tone of Voice. Format the output ENTIRELY in clean HTML (using <h1>, <h2>, <p>, <ul>, <li>, <strong>, and inline styles for color swatches). Do not use markdown, only HTML.`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        htmlContent: { type: Type.STRING, description: "The full generated brand book formatted in HTML" }
      },
      required: ["htmlContent"]
    };
  } else if (machineId === 'visualGenerator') {
    systemInstruction = `You are the 'Senior Graphic Designer & Art Director' for 'Moonlight 🌕'. ${personaInstruction} ${brandContext} 
    Your task is to generate a MASTERPIECE design prompt in English for a high-end social media advertisement. 
    The prompt MUST describe a complete graphic design layout, not just a photo. 
    Include: 
    1. Professional layout (e.g., split screen, bento grid, or minimalist centered).
    2. High-end typography placeholders and graphic elements (borders, shapes, icons).
    3. Cinematic lighting and studio-quality product presentation.
    4. Brand colors and a "Moonlight" luxury aesthetic.
    5. Specific details about textures, materials, and 8k resolution.
    
    The prompt should be long, detailed, and optimized for advanced AI image generators like Flux or Midjourney.
    Also, provide a persuasive, high-converting Arabic caption for the post.`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        designPrompt: { type: Type.STRING, description: "The detailed English prompt for image generation" },
        arabicCaption: { type: Type.STRING, description: "The persuasive Arabic caption for the social media post" }
      },
      required: ["designPrompt", "arabicCaption"]
    };
  } else if (machineId === 'cvMaker') {
    systemInstruction = `You are an expert CV Designer and Career Coach for 'Moonlight 🌕'. ${personaInstruction} ${brandContext} The user will provide their professional details. Generate a high-impact, professional CV in Arabic. Include: Professional Summary, Work Experience, Education, Skills, and Contact Info. Format the output ENTIRELY in clean HTML with professional styling (using <h1>, <h2>, <p>, <ul>, <li>, <strong>, and inline styles for a clean, modern layout). Do not use markdown, only HTML.`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        htmlContent: { type: Type.STRING, description: "The full generated CV formatted in HTML" }
      },
      required: ["htmlContent"]
    };
  } else if (machineId === 'templateMaker') {
    systemInstruction = `You are a Creative Template Designer for 'Moonlight 🌕'. ${personaInstruction} ${brandContext} The user wants a template for a specific purpose (e.g., Invoice, Letterhead, Social Media Plan). Generate a comprehensive, ready-to-use template in Arabic. Format the output ENTIRELY in clean HTML with professional styling (using <h1>, <h2>, <p>, <ul>, <li>, <strong>, and inline styles for a structured layout). Do not use markdown, only HTML.`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        htmlContent: { type: Type.STRING, description: "The full generated template formatted in HTML" }
      },
      required: ["htmlContent"]
    };
  } else if (machineId === 'bananaGenerator') {
    systemInstruction = `You are the 'Chief Banana Officer' for 'Moonlight 🌕'. ${personaInstruction} ${brandContext} 
    Your goal is to generate 'Crazy', 'Wild', and 'Unconventional' marketing ideas and hooks in Arabic, AND a high-end visual design prompt in English. 
    Be extremely creative, funny, and bold. Break the rules of traditional marketing.
    
    For each idea, provide:
    1. 'type': The type of idea.
    2. 'content': The detailed marketing idea in Arabic.
    3. 'crazyLevel': A number from 1-10.
    4. 'bananaHook': A catchy, unconventional hook in Arabic.
    5. 'designPrompt': A formulaic, professional prompt for AI (Flux): 
       "Ultra-high-definition professional product concept design, [Subject describing the idea], [Style: e.g. Minimalist/Futuristic/Luxury/Surreal], [Lighting: e.g. Cinematic/Studio Lighting], [Composition: Focused/Isometric View/Close-up], [Color Palette: e.g. Vibrant/Muted Elegance], 8k, highly detailed, photorealistic, commercial advertising quality."`;
    
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        ideas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              content: { type: Type.STRING },
              crazyLevel: { type: Type.NUMBER },
              bananaHook: { type: Type.STRING },
              designPrompt: { type: Type.STRING, description: "Detailed, formulaic English prompt for high-end image generation." }
            },
            required: ["type", "content", "crazyLevel", "bananaHook", "designPrompt"]
          }
        }
      },
      required: ["ideas"]
    };
  } else {
    systemInstruction = `You are a creative content director for 'Moonlight 🌕'. ${personaInstruction} ${brandContext} Provide 3-4 creative content ideas (video scripts, social media posts) based on the user's input in Arabic.`;
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        ideas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "e.g., Video Script, Instagram Post" },
              content: { type: Type.STRING }
            },
            required: ["type", "content"]
          }
        }
      },
      required: ["ideas"]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Factory Machine Error (Full):", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    throw error;
  }
}
