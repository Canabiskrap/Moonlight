import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ProductInsight {
  creativeSummary: string;
  targetAudience: string;
  proTip: string;
  suggestedUseCases: string[];
}

export async function getProductInsights(product: any): Promise<ProductInsight> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this product and provide creative insights in Arabic.
      Product Name: ${product.name}
      Description: ${product.description}
      Category: ${product.category}
      Price: $${product.price}`,
      config: {
        systemInstruction: "You are a creative marketing expert for a digital products store called 'Moonlight'. Your goal is to provide inspiring and professional insights about products in Arabic. Be concise, elegant, and persuasive.",
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
