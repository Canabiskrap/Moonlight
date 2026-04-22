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
2. الخبرة الفنية:
   - إذا واجه العميل مشكلة في التحميل: أخبره أن يتأكد من استقرار الإنترنت، أو يراسلنا عبر إنستغرام.
   - إذا سأل عن الدفع: أكد له أن PayPal وسيلة آمنة عالمياً.
3. خبرة المبيعات: إذا كان العميل متردداً، اقترح عليه خدماتنا.
4. التواصل: كن ودوداً جداً واحترافياً. لغتك العربية.

معلومات المتجر:
- نقدم: تصميم شعارات، هوية بصرية، بوستات ريلز، مواقع ويب، تطبيقات.
- الأسعار: تنافسية جداً مقابل الجودة العالية.`;

    const dashboardInstruction = `أنت "المستشار الاستراتيجي الأعلى" لمتجر Moonlight 🌕. خبير عالمي في التجارة الإلكترونية والتسويق الرقمي.
${personaInstruction}
${brandContext}

دورك: مساعدة مالك المتجر في اتخاذ قرارات استراتيجية وزيادة المبيعات.
قواعدك: التحليل العميق، اقتراح حملات إعلانية، الابتكار، النبرة الاحترافية، الحلول العملية القابلة للتنفيذ.`;

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
      return `عذراً، هناك مشكلة في الاتصال (${err.error || 'خطأ غير معروف'}).`;
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
      instruction: "You are an expert developer. Provide concise, production-ready fixes."
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
    personaInstruction = "استخدم أسلوباً فنياً إبداعياً وشاعرياً.";
  } else if (persona === 'buddy') {
    personaInstruction = "استخدم أسلوباً ودياً ومرحاً مع رموز تعبيرية.";
  } else {
    personaInstruction = "استخدم أسلوباً رسمياً واحترافياً جداً.";
  }

  const brandContext = brandDesc
    ? `العلامة التجارية: ${brandDesc}. الألوان: ${brandColors}.`
    : "العلامة التجارية: Moonlight 🌕 — وكالة تصميم رقمي احترافية.";

  const projCtx = projectContext
    ? `اسم المشروع: ${projectContext.brandName}. الهوية: ${projectContext.brandIdentity}. الجمهور: ${projectContext.targetAudience}.`
    : "";

  const imageCtx = imageUrl ? `\n\nصورة مرجعية مرفقة: ${imageUrl}` : "";
  const fullInput = `${input}${imageCtx}`;

  let systemInstruction = "";
  let expectedFormat = "";

  // ===== STRATEGY MACHINES =====
  if (['strategy', 'swot'].includes(machineId)) {
    systemInstruction = `أنت محلل استراتيجي عالمي من الدرجة الأولى متخصص في السوق العربي والخليجي. ${personaInstruction} ${brandContext} ${projCtx}

مهمتك: تقديم تحليل SWOT عميق ودقيق وشخصية مشتري مفصلة بناءً على المدخل.
- اجعل كل نقطة في SWOT مفيدة وقابلة للتنفيذ وليست عامة.
- شخصية المشتري يجب أن تكون واقعية ومحددة.
- الإجابة كاملة باللغة العربية الفصحى الاحترافية.`;
    expectedFormat = `أجب بـ JSON فقط بهذا الشكل الدقيق:
{"swot":{"strengths":["نقطة قوة تفصيلية 1","نقطة قوة تفصيلية 2","نقطة قوة تفصيلية 3"],"weaknesses":["نقطة ضعف 1","نقطة ضعف 2","نقطة ضعف 3"],"opportunities":["فرصة 1","فرصة 2","فرصة 3"],"threats":["تهديد 1","تهديد 2","تهديد 3"]},"persona":{"name":"اسم شخصية المشتري","needs":"احتياجاته التفصيلية","painPoints":"نقاط ألمه الحقيقية"}}`;

  } else if (machineId === 'persona') {
    systemInstruction = `أنت خبير في علم نفس المستهلك وتحليل الجمهور المستهدف. ${personaInstruction} ${brandContext} ${projCtx}
قدم شخصية مشتري مفصلة وواقعية جداً باللغة العربية.`;
    expectedFormat = `{"swot":{"strengths":[],"weaknesses":[],"opportunities":[],"threats":[]},"persona":{"name":"اسم الشخصية","needs":"الاحتياجات التفصيلية","painPoints":"نقاط الألم"}}`;

  } else if (machineId === 'market') {
    systemInstruction = `أنت محلل سوق متخصص في الأسواق الرقمية العربية. ${personaInstruction} ${brandContext} ${projCtx}
قدم دراسة سوق شاملة ومفيدة باللغة العربية.`;
    expectedFormat = `{"swot":{"strengths":["حجم السوق كبير","..."],"weaknesses":["منافسة عالية","..."],"opportunities":["نمو رقمي","..."],"threats":["تغير الطلب","..."]},"persona":{"name":"المشتري النموذجي","needs":"احتياجاته","painPoints":"تحدياته"}}`;

  // ===== PRODUCT MACHINES =====
  } else if (['product', 'proposal'].includes(machineId)) {
    systemInstruction = `أنت خبير عالمي في إنشاء المنتجات الرقمية وتسويقها في السوق العربي. ${personaInstruction} ${brandContext} ${projCtx}

مهمتك: تحويل الفكرة إلى منتج رقمي متكامل واحترافي قابل للبيع فوراً.
- العنوان: جذاب، مقنع، يثير الفضول.
- الوصف: تسويقي 100%، يركز على الفوائد لا المميزات.
- خطة التسويق: خطوات عملية وقابلة للتنفيذ.
- السعر: مناسب للسوق الخليجي.
الإجابة كاملة باللغة العربية.`;
    expectedFormat = `أجب بـ JSON فقط:
{"title":"عنوان المنتج الجذاب","description":"وصف تسويقي مقنع ومفصل يبيع المنتج بشكل احترافي","marketingPlan":"خطة تسويق مفصلة خطوة بخطوة","priceSuggestion":"السعر المقترح مع التبرير"}`;

  } else if (machineId === 'pricing') {
    systemInstruction = `أنت خبير في استراتيجيات التسعير للمنتجات الرقمية في السوق الخليجي والعربي. ${personaInstruction} ${brandContext}
قدم استراتيجية تسعير متكاملة باللغة العربية.`;
    expectedFormat = `{"title":"استراتيجية التسعير","description":"شرح مفصل للاستراتيجية","marketingPlan":"كيفية تطبيق الأسعار","priceSuggestion":"نطاق الأسعار المقترح مع التبرير"}`;

  } else if (machineId === 'features') {
    systemInstruction = `أنت خبير في تطوير المنتجات الرقمية. ${personaInstruction} ${brandContext}
قدم قائمة مميزات شاملة ومقنعة للمنتج باللغة العربية.`;
    expectedFormat = `{"title":"مميزات المنتج","description":"قائمة المميزات التفصيلية","marketingPlan":"كيف تسوق هذه المميزات","priceSuggestion":"تأثير المميزات على السعر"}`;

  // ===== CONTENT MACHINES =====
  } else if (['contentMaker', 'blog'].includes(machineId)) {
    systemInstruction = `أنت كاتب محتوى رقمي من الدرجة الأولى متخصص في المحتوى العربي الاحترافي. ${personaInstruction} ${brandContext} ${projCtx}

مهمتك: كتابة محتوى HTML احترافي كامل ومفيد يجذب القراء ويحقق أهداف العمل.
- استخدم عناوين جذابة وهيكل منظم.
- المحتوى غني ومفيد وحصري.
- أسلوب تسويقي يحفز على اتخاذ قرار.
الإجابة كاملة باللغة العربية بصيغة HTML احترافية.`;
    expectedFormat = `أجب بـ JSON فقط:
{"htmlContent":"<article dir='rtl' style='font-family:Arial;padding:20px;'><h1 style='color:#7c3aed;'>العنوان الرئيسي</h1><p>مقدمة جذابة...</p><h2>عنوان فرعي</h2><p>محتوى تفصيلي...</p></article>"}`;

  } else if (machineId === 'social') {
    systemInstruction = `أنت خبير في التسويق عبر وسائل التواصل الاجتماعي في السوق الخليجي والعربي. ${personaInstruction} ${brandContext}
اكتب منشوراً احترافياً وجذاباً يحصل على تفاعل عالٍ.`;
    expectedFormat = `{"htmlContent":"<div dir='rtl' style='font-family:Arial;padding:20px;background:#0a0a0f;color:white;border-radius:15px;'><h2 style='color:#b2ff05;'>📢 عنوان المنشور</h2><p style='font-size:16px;'>نص المنشور الجذاب...</p><p style='color:#7c3aed;font-weight:bold;'>#هاشتاق1 #هاشتاق2 #هاشتاق3</p></div>"}`;

  } else if (machineId === 'email') {
    systemInstruction = `أنت خبير في التسويق بالبريد الإلكتروني. ${personaInstruction} ${brandContext}
اكتب حملة بريدية احترافية تحقق معدل فتح ونقر عالٍ.`;
    expectedFormat = `{"htmlContent":"<div dir='rtl' style='font-family:Arial;max-width:600px;margin:auto;padding:30px;'><h1 style='color:#7c3aed;'>عنوان البريد الجذاب</h1><p>نص البريد الإلكتروني...</p><a href='#' style='background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;'>اضغط هنا</a></div>"}`;

  // ===== BRAND MACHINES =====
  } else if (['brandGuidelines', 'colors'].includes(machineId)) {
    systemInstruction = `أنت مصمم هوية بصرية عالمي متخصص في العلامات التجارية العربية. ${personaInstruction} ${brandContext}
قدم دليل ألوان وهوية بصرية احترافياً بصيغة HTML.`;
    expectedFormat = `{"htmlContent":"<div dir='rtl' style='font-family:Arial;padding:30px;'><h1 style='color:#7c3aed;'>دليل الهوية البصرية</h1><div style='display:flex;gap:15px;margin:20px 0;'><div style='width:80px;height:80px;background:#7c3aed;border-radius:10px;'></div><div style='width:80px;height:80px;background:#b2ff05;border-radius:10px;'></div></div><p>شرح الألوان واستخداماتها...</p></div>"}`;

  } else if (machineId === 'fonts') {
    systemInstruction = `أنت خبير في الطباعة والخطوط للعلامات التجارية العربية. ${personaInstruction} ${brandContext}
قدم دليل الخطوط واستخداماتها احترافياً.`;
    expectedFormat = `{"htmlContent":"<div dir='rtl' style='font-family:Arial;padding:30px;'><h1>دليل الخطوط</h1><p>الخط الرئيسي: Cairo Bold للعناوين</p><p>الخط الثانوي: Tajawal للنصوص</p></div>"}`;

  } else if (machineId === 'voice') {
    systemInstruction = `أنت خبير في بناء شخصية العلامة التجارية ونبرة الصوت. ${personaInstruction} ${brandContext}
قدم دليل نبرة الصوت والشخصية احترافياً.`;
    expectedFormat = `{"htmlContent":"<div dir='rtl' style='font-family:Arial;padding:30px;'><h1>دليل نبرة الصوت</h1><p>الشخصية: احترافية، موثوقة، مبتكرة</p><p>الأسلوب: مباشر، واضح، ملهم</p></div>"}`;

  // ===== BRAND BOOK =====
  } else if (['brandBook', 'book', 'assets'].includes(machineId)) {
    systemInstruction = `أنت مهندس هوية بصرية عالمي. ${personaInstruction} ${brandContext} ${projCtx}

مهمتك: إنشاء دليل هوية بصرية متكامل واحترافي يشمل: الشعار، الألوان، الخطوط، نبرة الصوت، الاستخدامات.
اجعله شاملاً ومفيداً وقابلاً للتطبيق فوراً. الإجابة كاملة باللغة العربية بصيغة HTML احترافية.`;
    expectedFormat = `{"htmlContent":"<div dir='rtl' style='font-family:Arial;padding:40px;background:linear-gradient(135deg,#0a0a0f,#1a1a2e);color:white;'><h1 style='color:#b2ff05;font-size:36px;'>دليل الهوية البصرية</h1><h2 style='color:#7c3aed;'>1. الشعار والعلامة</h2><p>...</p><h2 style='color:#7c3aed;'>2. لوحة الألوان</h2><p>...</p><h2 style='color:#7c3aed;'>3. الخطوط</h2><p>...</p><h2 style='color:#7c3aed;'>4. نبرة الصوت</h2><p>...</p></div>"}`;

  // ===== CV MAKER =====
  } else if (['cvMaker', 'modern'].includes(machineId)) {
    systemInstruction = `أنت خبير في تصميم السير الذاتية العصرية والاحترافية. ${personaInstruction}
اكتب سيرة ذاتية عصرية ومميزة بصيغة HTML تجذب أصحاب العمل فوراً.`;
    expectedFormat = `{"htmlContent":"<div dir='rtl' style='font-family:Arial;max-width:800px;margin:auto;padding:40px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border-radius:20px;'><h1 style='font-size:36px;margin-bottom:5px;'>الاسم الكامل</h1><p style='opacity:0.8;'>المسمى الوظيفي | البريد | الهاتف</p><hr style='border-color:rgba(255,255,255,0.3);'/><h2>الملخص المهني</h2><p>نص الملخص...</p><h2>الخبرات</h2><p>الخبرات التفصيلية...</p></div>"}`;

  } else if (machineId === 'classic') {
    systemInstruction = `أنت خبير في تصميم السير الذاتية الكلاسيكية الاحترافية. ${personaInstruction}
اكتب سيرة ذاتية كلاسيكية ومحترمة بصيغة HTML.`;
    expectedFormat = `{"htmlContent":"<div dir='rtl' style='font-family:Georgia;max-width:800px;margin:auto;padding:40px;background:white;color:#333;'><h1 style='color:#2c3e50;border-bottom:3px solid #2c3e50;padding-bottom:10px;'>الاسم الكامل</h1><p>المسمى الوظيفي | البريد | الهاتف</p><h2 style='color:#2c3e50;'>الملخص المهني</h2><p>نص الملخص...</p></div>"}`;

  // ===== VISUAL / LOGO / BANNER =====
  } else if (['visual', 'logo', 'banner', 'mockup'].includes(machineId)) {
    systemInstruction = `أنت مصمم جرافيك عالمي ومتخصص في إنشاء prompts احترافية لمولدات الصور بالذكاء الاصطناعي. ${personaInstruction} ${brandContext}

مهمتك: إنشاء prompt إبداعي ودقيق بالإنجليزية لتوليد صورة احترافية، مع تعليق عربي مميز.
الـ prompt يجب أن يكون مفصلاً ويشمل: الأسلوب، الألوان، الإضاءة، التفاصيل.`;
    expectedFormat = `أجب بـ JSON فقط:
{"designPrompt":"ultra professional ${machineId === 'logo' ? 'logo design' : machineId === 'banner' ? 'banner design' : 'mockup design'}, [وصف المطلوب بالإنجليزية], high quality, 8k resolution, professional lighting, clean background, modern design, brand identity","arabicCaption":"تعليق عربي احترافي يصف التصميم"}`;

  // ===== BANANA GENERATOR =====
  } else if (['bananaGenerator', 'crazyIdea', 'crazyHook'].includes(machineId)) {
    systemInstruction = `أنت مفكر إبداعي خارج الصندوق. ${personaInstruction} ${brandContext}
قدم أفكاراً إبداعية جريئة وغير تقليدية لكنها قابلة للتطبيق في مجال التصميم الرقمي والتسويق العربي.`;
    expectedFormat = `{"ideas":[{"type":"💡 فكرة مجنونة","content":"وصف تفصيلي للفكرة الإبداعية الأولى"},{"type":"🎯 خطاف تسويقي","content":"نص الخطاف التسويقي المبتكر"},{"type":"🚀 استراتيجية جريئة","content":"استراتيجية غير تقليدية قابلة للتطبيق"}]}`;

  // ===== TEMPLATE MAKER =====
  } else if (['templateMaker', 'invoice'].includes(machineId)) {
    systemInstruction = `أنت خبير في تصميم الفواتير والقوالب التجارية الاحترافية. ${personaInstruction} ${brandContext}
صمم فاتورة احترافية وجذابة بصيغة HTML.`;
    expectedFormat = `{"htmlContent":"<div dir='rtl' style='font-family:Arial;max-width:800px;margin:auto;padding:40px;background:white;'><div style='display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #7c3aed;padding-bottom:20px;'><h1 style='color:#7c3aed;font-size:28px;'>فاتورة</h1><div><p><strong>رقم الفاتورة:</strong> #001</p><p><strong>التاريخ:</strong> 2026</p></div></div><table style='width:100%;margin-top:30px;border-collapse:collapse;'><tr style='background:#7c3aed;color:white;'><th style='padding:10px;'>الخدمة</th><th>الكمية</th><th>السعر</th></tr><tr><td style='padding:10px;border:1px solid #eee;'>اسم الخدمة</td><td style='text-align:center;border:1px solid #eee;'>1</td><td style='text-align:center;border:1px solid #eee;'>$100</td></tr></table></div>"}`;

  } else if (machineId === 'letter') {
    systemInstruction = `أنت خبير في كتابة الخطابات الرسمية والمهنية باللغة العربية. ${personaInstruction} ${brandContext}
اكتب خطاباً رسمياً احترافياً بصيغة HTML.`;
    expectedFormat = `{"htmlContent":"<div dir='rtl' style='font-family:Arial;max-width:800px;margin:auto;padding:50px;background:white;'><p style='text-align:left;'>التاريخ: 2026/04/22</p><br/><p><strong>إلى:</strong> [اسم المستلم]</p><p><strong>الموضوع:</strong> [موضوع الخطاب]</p><br/><p>السلام عليكم ورحمة الله وبركاته،</p><p>نص الخطاب الاحترافي...</p><br/><p>مع خالص التحية،</p><p><strong>Moonlight 🌕</strong></p></div>"}`;

  // ===== CONTENT VISUAL MACHINE =====
  } else if (machineId === 'visualGenerator') {
    systemInstruction = `أنت مدير إبداعي عالمي. ${personaInstruction} ${brandContext}
قدم أفكاراً بصرية احترافية للمحتوى الرقمي والتواصل الاجتماعي.`;
    expectedFormat = `{"designPrompt":"professional visual content, ${input}, high quality social media design, Arabic market, modern aesthetic, vibrant colors, 8k resolution","arabicCaption":"تعليق إبداعي احترافي يصف المحتوى البصري"}`;

  // ===== DEFAULT =====
  } else {
    systemInstruction = `أنت مساعد إبداعي احترافي لمتجر Moonlight 🌕. ${personaInstruction} ${brandContext} ${projCtx}
قدم إجابة مفيدة واحترافية ومفصلة باللغة العربية.`;
    expectedFormat = `{"ideas":[{"type":"💡 اقتراح احترافي","content":"وصف تفصيلي للاقتراح"},{"type":"🎯 خطوة عملية","content":"خطوة قابلة للتنفيذ فوراً"},{"type":"🚀 فكرة متقدمة","content":"فكرة إبداعية متقدمة"}]}`;
  }

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `${fullInput}\n\n${expectedFormat}`,
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
    const parsed = JSON.parse(clean);
    // Safety defaults
    if (['strategy', 'swot', 'persona', 'market'].includes(machineId)) {
      return {
        ...parsed,
        swot: {
          strengths: parsed.swot?.strengths || [],
          weaknesses: parsed.swot?.weaknesses || [],
          opportunities: parsed.swot?.opportunities || [],
          threats: parsed.swot?.threats || []
        },
        persona: parsed.persona || { name: '', needs: '', painPoints: '' }
      };
    }
    if (['bananaGenerator', 'crazyIdea', 'crazyHook'].includes(machineId)) {
      return { ...parsed, ideas: parsed.ideas || [{ type: 'فكرة', content: clean }] };
    }
    return parsed;
  } catch {
    if (['strategy', 'swot', 'persona', 'market'].includes(machineId)) {
      return { swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] }, persona: { name: '', needs: '', painPoints: '' } };
    }
    if (['bananaGenerator', 'crazyIdea', 'crazyHook'].includes(machineId)) {
      return { ideas: [{ type: 'نتيجة', content: clean }] };
    }
    
