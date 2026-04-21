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
  return data.imageUrl || data.text;
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
          2. الترويج والتسويق: اقترح حملات إعلانية، استراتيجيات تسعير، وطرق لزيادة الـ Conversion Rate.
          3. الابتكار: اطرح أفكاراً لمنتجات أو خدمات جديدة تناسب هوية Moonlight.
          4. النبرة: احترافية جداً، ملهمة، ومباشرة.
          5. الحلول العملية: أعطِ خطوات قابلة للتنفيذ.`;

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
    console.error("Chat Error:", error);
    return `عذراً، حدث خطأ فني: ${error.message}`;
  }
}

export async function generateFixSuggestion(prompt: string): Promise<string> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: prompt,
      history: [],
      instruction: "You are an expert developer. Provide concise, production-ready code fixes in Arabic."
    })
  });
  if (!response.ok) return "No fix suggestion available.";
  const data = await response.json();
  return data.text || "No fix suggestion available.";
}

export async function runFactoryMachine(machineId: string, input: string, imageUrl?: string, settings?: any, projectContext?: any): Promise<any> {
    const persona = settings?.aiPersona || 'ceo';
    const brandDesc = settings?.brandDescription || '';
    const brandColors = settings?.brandColors?.join(', ') || '';

    let personaInstruction = "";
    if (persona === 'artist') {
        personaInstruction = "تحدث بنبرة فنية، ملهمة، وشاعرية.";
    } else if (persona === 'buddy') {
        personaInstruction = "تحدث بنبرة ودودة جداً، مرحة، وغير رسمية.";
    } else {
        personaInstruction = "تحدث بنبرة رسمية، مباشرة، واحترافية جداً.";
    }

    const brandContext = brandDesc ? `معلومات عن العلامة التجارية: ${brandDesc}. الألوان المعتمدة: ${brandColors}.` : "";
    const projContextStr = projectContext ? `سياق المشروع: الاسم: ${projectContext.brandName}, الهوية: ${projectContext.brandIdentity}, الجمهور: ${projectContext.targetAudience}.` : "";
    const finalBrandContext = `${brandContext} ${projContextStr}`;

    const baseDirective = `أنت مساعد ذكي لمتجر Moonlight 🌕. ${personaInstruction} ${finalBrandContext} أجب باللغة العربية فقط بشكل احترافي.`;

    let systemInstruction = "";
    let expectedFormat = "";

    if (machineId === 'strategy' || machineId === 'swot') {
        systemInstruction = `${baseDirective} أنت محلل استراتيجي عالمي. قدم تحليل SWOT وشخصية المشتري.`;
        expectedFormat = `أجب بـ JSON فقط بهذا الشكل: {"swot":{"strengths":["..."],"weaknesses":["..."],"opportunities":["..."],"threats":["..."]},"persona":{"name":"...","needs":"...","painPoints":"..."}}`;
    } else if (machineId === 'product' || machineId === 'proposal') {
        systemInstruction = `${baseDirective} أنت خبير في إنشاء المنتجات الرقمية. حول الفكرة إلى منتج رقمي متكامل.`;
        expectedFormat = `أجب بـ JSON فقط بهذا الشكل: {"title":"...","description":"...","marketingPlan":"...","priceSuggestion":"..."}`;
    } else if (machineId === 'contentMaker' || machineId === 'blog' || machineId === 'social' || machineId === 'email') {
        systemInstruction = `${baseDirective} أنت كاتب محتوى رقمي محترف. اكتب محتوى كامل ومقنع بصيغة HTML.`;
        expectedFormat = `أجب بـ JSON فقط بهذا الشكل: {"htmlContent":"<div>...</div>"}`;
    } else if (machineId === 'brandBook' || machineId === 'book') {
        systemInstruction = `${baseDirective} أنت مهندس هوية بصرية. أنشئ دليل هوية بصرية متكامل بصيغة HTML.`;
        expectedFormat = `أجب بـ JSON فقط بهذا الشكل: {"htmlContent":"<div>...</div>"}`;
    } else if (machineId === 'cvMaker' || machineId === 'modern' || machineId === 'classic') {
        systemInstruction = `${baseDirective} أنت خبير في تصميم السير الذاتية. أنشئ سيرة ذاتية احترافية بصيغة HTML.`;
        expectedFormat = `أجب بـ JSON فقط بهذا الشكل: {"htmlContent":"<div>...</div>"}`;
    } else if (machineId === 'brandGuidelines' || machineId === 'colors' || machineId === 'fonts' || machineId === 'voice') {
        systemInstruction = `${baseDirective} أنت خبير في الهوية البصرية. قدم إرشادات العلامة التجارية.`;
        expectedFormat = `أجب بـ JSON فقط بهذا الشكل: {"htmlContent":"<div>...</div>"}`;
    } else if (machineId === 'templateMaker' || machineId === 'invoice' || machineId === 'letter') {
        systemInstruction = `${baseDirective} أنت خبير في تصميم القوالب. أنشئ قالباً احترافياً بصيغة HTML.`;
        expectedFormat = `أجب بـ JSON فقط بهذا الشكل: {"htmlContent":"<div>...</div>"}`;
    } else if (machineId === 'bananaGenerator' || machineId === 'crazyIdea' || machineId === 'crazyHook') {
        systemInstruction = `${baseDirective} أنت مولد أفكار إبداعية غير تقليدية.`;
        expectedFormat = `أجب بـ JSON فقط بهذا الشكل: {"ideas":[{"type":"فكرة","content":"..."},{"type":"خطاف","content":"..."}]}`;
    } else if (machineId === 'visual' || machineId === 'logo' || machineId === 'banner' || machineId === 'mockup') {
        systemInstruction = `${baseDirective} أنت مصمم جرافيك محترف. قدم وصف تصميم احترافي.`;
        expectedFormat = `أجب بـ JSON فقط بهذا الشكل: {"designPrompt":"...","arabicCaption":"..."}`;
    } else {
        systemInstruction = `${baseDirective} قدم إجابة مفيدة واحترافية.`;
        expectedFormat = `أجب بـ JSON فقط بهذا الشكل: {"ideas":[{"type":"اقتراح","content":"..."}]}`;
    }

    const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `${imageUrl ? `(صورة مرفقة: ${imageUrl})\n` : ''}${input}\n\n${expectedFormat}`,
            history: [],
            instruction: systemInstruction
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Factory machine failed');
    }

    const data = await response.json();
    const text = data.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    
    try {
        return JSON.parse(clean);
    } catch {
        return { htmlContent: clean, text: clean };
    }
}
