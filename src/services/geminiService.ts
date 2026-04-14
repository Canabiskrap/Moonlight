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
      model: "gemini-3-flash-preview",
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

export async function chatWithBot(userMessage: string, history: {role: 'user' | 'model', parts: {text: string}[]}[], context: 'customer' | 'dashboard' = 'customer'): Promise<string> {
  if (!ai) {
    const hasKey = !!GEMINI_KEY;
    const errorMsg = "Gemini AI not initialized. API Key is " + (hasKey ? "present" : "MISSING");
    console.error(errorMsg);
    return `عذراً، هناك مشكلة في تهيئة الذكاء الاصطناعي (${hasKey ? 'مفتاح موجود ولكن فشل الاتصال' : 'مفتاح مفقود'}). يرجى التواصل مع الدعم الفني.`;
  }
  try {
    const customerInstruction = `أنت "المساعد الخبير" لـ Moonlight 🌕. أنت لست مجرد بوت، بل خبير في التصميم الرقمي والدعم الفني.
          
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

export async function runFactoryMachine(machineId: string, input: string): Promise<any> {
  if (!ai) throw new Error("AI service not initialized. Missing API Key.");
  
  let systemInstruction = "";
  let responseSchema: any = {};

  if (machineId === 'strategy') {
    systemInstruction = "You are a world-class marketing strategist for 'Moonlight 🌕'. Analyze the user's business idea and provide a SWOT analysis and a Buyer Persona in Arabic.";
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
    systemInstruction = "You are a digital product creator for 'Moonlight 🌕'. Convert a simple idea into a full product proposal in Arabic, including a catchy title, persuasive description, marketing plan, and price suggestion.";
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
  } else {
    systemInstruction = "You are a creative content director for 'Moonlight 🌕'. Provide 3-4 creative content ideas (video scripts, social media posts) based on the user's input in Arabic.";
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
      contents: input,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Factory Machine Error:", error);
    throw error;
  }
}
