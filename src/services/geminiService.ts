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

export async function chatWithBot(userMessage: string, history: {role: 'user' | 'model', parts: {text: string}[]}[], products?: any[]): Promise<string> {
  if (!ai) {
    const hasKey = !!GEMINI_KEY;
    const errorMsg = "Gemini AI not initialized. API Key is " + (hasKey ? "present" : "MISSING");
    console.error(errorMsg);
    return `عذراً، هناك مشكلة في تهيئة الذكاء الاصطناعي (${hasKey ? 'مفتاح موجود ولكن فشل الاتصال' : 'مفتاح مفقود'}). يرجى التواصل مع الدعم الفني.`;
  }
  try {
    console.log("Calling Gemini with message:", userMessage);
    
    // Build product catalog context if products are provided
    const productCatalog = products && products.length > 0 
      ? `\n\nقائمة منتجات المتجر الحالية (${products.length} منتج):
${products.map((p, i) => `${i + 1}. ${p.name} - الفئة: ${p.category} - السعر: $${p.price} - ${p.description || 'بدون وصف'}`).join('\n')}`
      : '';
    
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: `أنت مساعد متجر Moonlight المتخصص في الهويات البصرية والتصميم الاحترافي.
          
          === هويتك ===
          اسمك: "مساعد Moonlight الذكي"
          دورك: خبير تصميم رقمي ومستشار مبيعات
          
          === منتجات المتجر (40+ منتج) ===
          الفئات الرئيسية:
          1. السير الذاتية (CV Templates): قوالب احترافية جاهزة للتعديل، مناسبة للباحثين عن عمل والمهنيين
          2. قوالب السوشيال ميديا: بوستات انستجرام، ستوري، ريلز، فيسبوك، تيك توك
          3. الهويات البصرية: شعارات، بطاقات أعمال، أوراق رسمية، ختم، كروت عمل
          4. قوالب الويب: صفحات هبوط، مواقع شخصية، متاجر إلكترونية
          5. تصاميم خاصة: دعوات زفاف، منيو مطاعم، بروشورات، بنرات إعلانية
          ${productCatalog}
          
          === قواعد التعامل ===
          1. الرد بالعربية الفصحى بأسلوب ودود ومهني
          2. اقترح منتجات بناءً على احتياجات العميل
          3. إذا سأل عن منتج محدد، أعطه تفاصيله وسعره
          4. إذا كان متردداً، اشرح مميزات المنتج وكيف سيفيده
          5. ذكّره دائماً بإمكانية التواصل عبر واتساب للطلبات الخاصة
          
          === الدعم الفني ===
          - مشكلة التحميل: تأكد من استقرار الإنترنت أو تواصل عبر واتساب
          - الدفع: PayPal آمن وبعد الدفع يظهر زر التحميل تلقائياً
          - الصور لا تظهر: حدّث الصفحة (Refresh)
          
          === معلومات إضافية ===
          - جميع التصاميم عصرية وقابلة للتعديل
          - ملفات بجودة عالية (PSD, AI, Figma, Word, PowerPoint)
          - دعم فني مستمر عبر واتساب
          - أسعار تنافسية مقارنة بالجودة`,
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

export async function generateProductDescription(productName: string, category: string, price: string): Promise<string[]> {
  if (!ai) throw new Error("AI service not initialized. Missing API Key.");
  
  const categoryNames: Record<string, string> = {
    'cv': 'سيرة ذاتية',
    'social': 'سوشيال ميديا',
    'web': 'قوالب ويب',
    'other': 'تصميم عام'
  };
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `اكتب 3 أوصاف تسويقية مختلفة لهذا المنتج:
      اسم المنتج: ${productName}
      الفئة: ${categoryNames[category] || category}
      السعر: $${price}
      
      المطلوب: 3 أوصاف قصيرة (2-3 جمل لكل وصف) بالعربية، تسويقية وجذابة، تركز على الفوائد والقيمة للعميل.`,
      config: {
        systemInstruction: "أنت كاتب محتوى تسويقي محترف. اكتب أوصاف جذابة ومقنعة بالعربية. كل وصف يجب أن يكون فريداً ومختلفاً عن الآخر. ركز على الفوائد العملية والقيمة للعميل.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.8,
      }
    });

    const descriptions = JSON.parse(response.text);
    return Array.isArray(descriptions) ? descriptions.slice(0, 3) : [];
  } catch (error) {
    console.error("Gemini Description Error:", error);
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
