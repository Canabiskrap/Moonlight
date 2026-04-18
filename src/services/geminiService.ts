export interface ProductInsight {
  creativeSummary: string;
  targetAudience: string;
  proTip: string;
  suggestedUseCases: string[];
}

export async function getProductInsights(product: any): Promise<ProductInsight> {
  const response = await fetch('/api/ai/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to get product insights');
  }
  return response.json();
}

export async function getSmartRecommendations(query: string, products: any[]): Promise<string[]> {
  try {
    const response = await fetch('/api/ai/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, products })
    });
    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error("Recommendations Error:", error);
    return [];
  }
}

export const generateImageWithGemini = async (prompt: string, aspectRatio: string = "1:1") => {
  const response = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, aspectRatio })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to generate image');
  }
  const data = await response.json();
  return data.imageUrl || data.text; // Support both data URI and text response
};

export async function chatWithBot(
  userMessage: string, 
  history: {role: 'user' | 'model', parts: {text: string}[]}[], 
  context: 'customer' | 'dashboard' = 'customer',
  settings?: any
): Promise<string> {
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
             - إذا واجه العميل مشكلة في التحميل: أخبره أن يتأكد من استقرار الإنترنت، أو يراسلنا عبر إنستغرام لإرسال الملف يدوياً فوراً.
             - إذا سأل عن الدفع: أكد له أن PayPal وسيلة آمنة عالمياً، وبمجرد الدفع سيظهر زر "تحميل" تلقائياً.
             - إذا لم تظهر الصور: اطلب منه تحديث الصفحة (Refresh).
          3. خبرة المبيعات:
             - إذا كان العميل متردداً، اقترح عليه خدماتنا (لوجو، هوية بصرية، مواقع، تطبيقات).
             - اشرح له أن تصاميمنا "عصرية" و"تزيد من مبيعاته".
          4. التواصل:
             - كن ودوداً جداً واحترافياً.
             - لغتك هي العربية بلهجة مهذبة.
             - دائماً ذكّره بوجود أيقونة الإنستغرام للتحدث مع الإدارة مباشرة لأي طلبات خاصة.
          
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

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        history,
        context,
        instruction: context === 'dashboard' ? dashboardInstruction : customerInstruction
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return `عذراً، هناك مشكلة في الاتصال بالذكاء الاصطناعي (${err.error || 'خطأ غير معروف'}).`;
    }

    const data = await response.json();
    return data.text || "عذراً، لم أستطع فهم ذلك.";
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    return `عذراً، حدث خطأ فني: ${error.message}`;
  }
}

export async function generateFixSuggestion(prompt: string): Promise<string> {
  const response = await fetch('/api/ai/factory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: prompt,
      systemInstruction: "You are an expert developer. Provide concise, production-ready code fixes.",
      responseSchema: { type: 1 } // Using Type.STRING logic if handled on server
    })
  });
  if (!response.ok) return "No fix suggestion available.";
  const data = await response.json();
  return data.fix || data.htmlContent || JSON.stringify(data);
}

export async function runFactoryMachine(machineId: string, input: string, imageUrl?: string, settings?: any, projectContext?: any): Promise<any> {
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
    const projContextStr = projectContext ? `سياق المشروع: الاسم: ${projectContext.brandName}, الهوية: ${projectContext.brandIdentity}, الجمهور: ${projectContext.targetAudience}.` : "";
    const finalBrandContext = `${brandContext} ${projContextStr}`;

    const literalDirective = `
        CORE DIRECTIVE: LITERAL COMPLIANCE & ACCURACY.
        1. NO AGENTIC DRIFT: Execute the user's request exactly as written. Do not add "creative twists" unless explicitly asked for.
        2. IMAGE DIRECT MODE: If generating an image description or prompt, the SUBJECT requested MUST be the central focus.
        3. LANGUAGE: All output must be in Arabic (Persuasive, Professional, Moonlight-branded).
        4. ACCURACY: If the user provides an image or data, use it as the PRIMARY source of truth.
    `;

    let systemInstruction = "";
    let responseSchema: any = {};

    if (machineId === 'strategy') {
        systemInstruction = `${literalDirective} You are a world-class marketing strategist for 'Moonlight 🌕'. ${personaInstruction} ${finalBrandContext} Analyze the user's business idea and provide a SWOT analysis and a Buyer Persona in Arabic.`;
        responseSchema = {
            type: "object",
            properties: {
                swot: {
                    type: "object",
                    properties: {
                        strengths: { type: "array", items: { type: "string" } },
                        weaknesses: { type: "array", items: { type: "string" } },
                        opportunities: { type: "array", items: { type: "string" } },
                        threats: { type: "array", items: { type: "string" } }
                    },
                    required: ["strengths", "weaknesses", "opportunities", "threats"]
                },
                persona: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        needs: { type: "string" },
                        painPoints: { type: "string" }
                    },
                    required: ["name", "needs", "painPoints"]
                }
            },
            required: ["swot", "persona"]
        };
    } else if (machineId === 'product') {
        systemInstruction = `${literalDirective} You are a digital product creator for 'Moonlight 🌕'. ${personaInstruction} ${finalBrandContext} Convert a simple idea into a full product proposal in Arabic, including a catchy title, persuasive description, marketing plan, and price suggestion.`;
        responseSchema = {
            type: "object",
            properties: {
                title: { type: "string" },
                description: { type: "string" },
                marketingPlan: { type: "string" },
                priceSuggestion: { type: "string" }
            },
            required: ["title", "description", "marketingPlan", "priceSuggestion"]
        };
    } else if (machineId === 'contentMaker') {
        systemInstruction = `${literalDirective} You are an expert digital product creator and author for 'Moonlight 🌕'. ${personaInstruction} ${finalBrandContext} Write the FULL content for this product in Arabic. Format in HTML.`;
        responseSchema = {
            type: "object",
            properties: {
                htmlContent: { type: "string" }
            },
            required: ["htmlContent"]
        };
    } else if (machineId === 'brandBook') {
        systemInstruction = `${literalDirective} You are the 'Brand Book Architect' for 'Moonlight 🌕'. ${personaInstruction} ${brandContext} Generate a Brand Book in Arabic (HTML).`;
        responseSchema = {
            type: "object",
            properties: {
                htmlContent: { type: "string" }
            },
            required: ["htmlContent"]
        };
    } else if (machineId === 'visualGenerator') {
        systemInstruction = `${literalDirective} You are the 'Senior Graphic Designer' for 'Moonlight 🌕'. Generate a design prompt in English and an Arabic caption.`;
        responseSchema = {
            type: "object",
            properties: {
                designPrompt: { type: "string" },
                arabicCaption: { type: "string" }
            },
            required: ["designPrompt", "arabicCaption"]
        };
    } else {
        systemInstruction = `${literalDirective} You are a creative director for 'Moonlight 🌕'. Provide suggestions in Arabic.`;
        responseSchema = {
            type: "object",
            properties: {
                ideas: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            type: { type: "string" },
                            content: { type: "string" }
                        },
                        required: ["type", "content"]
                    }
                }
            },
            required: ["ideas"]
        };
    }

    const response = await fetch('/api/ai/factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: imageUrl ? `${input} (Image provided: ${imageUrl})` : input, systemInstruction, responseSchema })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Factory machine failed');
    }

    return response.json();
}
