import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
if (GEMINI_KEY) {
  console.log("Gemini API Key detected (starts with):", GEMINI_KEY.substring(0, 4) + "...");
} else {
  console.warn("Gemini API Key is MISSING from environment variables!");
}
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
      model: "gemini-flash-latest",
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
      model: "gemini-flash-latest",
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

export async function chatWithBot(userMessage: string, history: {role: 'user' | 'model', parts: {text: string}[]}[]): Promise<string> {
  if (!ai) {
    const hasKey = !!GEMINI_KEY;
    const errorMsg = "Gemini AI not initialized. API Key is " + (hasKey ? "present" : "MISSING");
    console.error(errorMsg);
    return `عذراً، هناك مشكلة في تهيئة الذكاء الاصطناعي (${hasKey ? 'مفتاح موجود ولكن فشل الاتصال' : 'مفتاح مفقود'}). يرجى التواصل مع الدعم الفني.`;
  }
  try {
    console.log("Calling Gemini with message:", userMessage);
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: `أنت "المساعد الخبير" لـ Moonlight 🌕. أنت لست مجرد بوت، بل خبير في التصميم الرقمي والدعم الفني.
          
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
          - الأسعار: تنافسية جداً مقابل الجودة العالية.`,
        temperature: 0.7,
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
      model: "gemini-flash-latest",
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
