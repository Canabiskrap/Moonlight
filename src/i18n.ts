import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ar: {
    translation: {
      nav: {
        home: 'الرئيسية',
        orders: 'طلباتي',
        protection: 'حماية المشتري',
        dashboard: 'لوحة التحكم',
        login: 'دخول',
        logout: 'خروج'
      },
      hero: {
        subtitle: 'Moonlight Digital Studio',
        title: 'هويتك الرقمية',
        titleAccent: 'باحترافية',
        description: 'نصمم لك مستقبلاً رقمياً يتجاوز التوقعات. من الهوية البصرية إلى تطوير الويب، نحن هنا لنصنع لك حضوراً لا يُنسى.',
        browseProducts: 'تصفح المنتجات',
        ourServices: 'خدماتنا',
        searchPlaceholder: 'اسأل Moonlight عن المنتج المناسب لمشروعك...',
        videoFallback: 'متصفحك لا يدعم تشغيل الفيديو.',
        categories: {
          all: 'الكل',
          cv: 'نماذج CV',
          social: 'سوشيال ميديا',
          web: 'تطوير ويب',
          other: 'أخرى'
        }
      },
      footer: {
        description: 'نحن نؤمن بأن كل فكرة تستحق أن تظهر بأفضل صورة ممكنة. Moonlight هو شريكك في رحلة النجاح الرقمي.',
        quickLinks: 'روابط سريعة',
        contactUs: 'تواصل معنا',
        contact: 'تواصل مع Moonlight',
        contactDesc: 'هل لديك فكرة مشروع؟ أو تحتاج لمساعدة تقنية؟ فريقنا جاهز للرد عليك فوراً.',
        terms: 'الشروط والأحكام',
        privacy: 'سياسة الخصوصية',
        recover: 'استعادة طلب'
      },
      common: {
        loading: 'جاري التحميل...',
        error: 'حدث خطأ ما',
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل'
      },
      protection: {
        header: {
          badge: 'بروتوكول حماية المشتري',
          title: 'دليل ضمان وحماية',
          titleAccent: 'مشترياتك في Moonlight',
          description: 'عزيزنا العميل، في Moonlight خصوصيتك وحقوقك التقنية هي أولويتنا. نحن نضمن لك وصولاً آمناً ودائماً لكل ما تشتريه.'
        },
        protocols: [
          {
            title: "نظام 'طلباتي' (المرجع الدائم)",
            desc: "بمجرد إتمام عملية الشراء وأنت مسجل دخولك، يتم أرشفة الحزمة تلقائياً في حسابك.",
            details: [
              "كيف تجدها؟ توجه إلى قائمة حسابك الشخصي > اختر 'طلباتي'.",
              "الميزة: ستجد قائمة بجميع مشترياتك السابقة مع روابط مباشرة لبوابات الدخول الخاصة بها، متاحة لك في أي وقت ومن أي جهاز."
            ]
          },
          {
            title: "التوثيق الفوري (بوابة العميل)",
            desc: "فور نجاح عملية الدفع، يتم توجيهك مباشرة إلى بوابة العميل الخاصة بك.",
            details: [
              "المحتوى: تحتوي البوابة على تفاصيل الفاتورة، مراحل التنفيذ، وروابط التحميل.",
              "نصيحة: احتفظ برابط البوابة أو رقم الطلب كمرجع دائم لك."
            ]
          },
          {
            title: "خاصية استعادة الطلب (الطوارئ)",
            desc: "في حال فقدت الوصول لطلبك أو أغلق الصفحة بالخطأ، وفرنا لك صفحة 'استعادة الطلب'.",
            details: [
              "كل ما تحتاجه هو إدخال (بريدك الإلكتروني + رقم الطلب) وسيقوم النظام فوراً بإعادة توجيهك إلى حزمتك المشتراة."
            ]
          },
          {
            title: "الدعم الفني المباشر",
            desc: "فريقنا متواجد لخدمتك عبر أيقونة WhatsApp الموجودة أسفل الموقع.",
            details: [
              "لا تضطر أبداً للدفع مرتين؛ فبمجرد التحقق من رقم العملية في لوحة التحكم لدينا، يتم تزويدك بالرابط يدوياً فوراً."
            ]
          }
        ],
        advice: {
          title: '💡 نصيحة لضمان أفضل تجربة',
          desc: 'يرجى دائماً التأكد من تسجيل الدخول قبل عملية الشراء لضمان ربط الحزمة بحسابك فوراً، والتأكد من صحة بريدك الإلكتروني لاستلام روابط الوصول بسرعة.',
          buttonOrders: 'تصفح طلباتي الآن',
          buttonHome: 'العودة للمتجر',
          footer: 'حقوقك محفوظة، ورحلتك معنا آمنة تماماً. 🌙✨'
        }
      },
      products: {
        title: 'المنتجات الرقمية',
        description: 'قوالب وأدوات جاهزة للاستخدام لرفع جودة عملك',
        comingSoonTitle: 'قريباً في Moonlight',
        comingSoonDesc: 'نعمل حالياً على تجهيز منتجات رقمية استثنائية ستغير قواعد اللعبة. كن مستعداً!',
        viewDetails: 'عرض التفاصيل',
        aiRecommended: 'ترشيح الذكاء الاصطناعي',
        notFound: 'المنتج غير موجود',
        errorLoading: 'خطأ في تحميل المنتج',
        backToStore: 'العودة للمتجر',
        premiumDigital: 'منتج رقمي مميز',
        securePayment: 'دفع آمن ومحمي. ستحصل على رابط التحميل فوراً وتلقائياً بعد إتمام العملية.',
        thanks: 'شكراً لثقتك!',
        paymentConfirmed: 'تم تأكيد الدفع، يمكنك التحميل الآن',
        downloadFiles: 'تحميل الملفات',
        category: 'الفئة',
        delivery: 'التسليم',
        instant: 'فوري',
        aiInsights: 'تحليل Moonlight الذكي',
        aiInsightsDesc: 'اكتشف كيف سيساعدك هذا المنتج في مشروعك',
        aiVision: 'رؤية الذكاء الاصطناعي',
        creativeSummary: 'ملخص إبداعي',
        targetAudience: 'الجمهور المستهدف',
        proTip: 'نصيحة Moonlight',
        bestUseCases: 'أفضل حالات الاستخدام'
      },
      services: {
        title: 'خدماتنا الاحترافية',
        description: 'حلول رقمية متكاملة مصممة خصيصاً لنمو أعمالك',
        startFrom: 'تبدأ من',
        orderNow: 'اطلب الآن',
        comingSoon: 'خدمات جديدة قادمة قريباً...',
        notFound: 'الخدمة غير موجودة',
        errorLoading: 'خطأ في تحميل الخدمة',
        professionalService: 'خدمة احترافية',
        securePayment: 'دفع آمن ومحمي. بعد إتمام الدفع، سنتواصل معك للبدء في تنفيذ الخدمة.',
        orderReceived: 'تم استلام الطلب!',
        thanks: 'شكراً لثقتك. سنتواصل معك عبر بريدك الإلكتروني قريباً جداً.',
        downloadAttached: 'تحميل الملفات المرفقة',
        contactWhatsapp: 'تواصل معنا عبر واتساب',
        backToHome: 'العودة للرئيسية',
        serviceType: 'نوع الخدمة',
        professional: 'احترافية',
        paymentMethod: 'طريقة الدفع',
        secure: 'آمنة',
        aiInsightsDesc: 'اكتشف كيف ستفيدك هذه الخدمة في مشروعك',
        addedValue: 'القيمة المضافة'
      },
      orderPortal: {
        notFound: 'الطلب غير موجود',
        errorLoading: 'خطأ في تحميل بيانات الطلب',
        checkLink: 'تأكد من صحة الرابط أو تواصل مع الدعم الفني للمساعدة.',
        backToStore: 'العودة للمتجر',
        customerPortal: '✦ بوابة العميل الخاصة',
        welcome: 'مرحباً بك',
        friend: 'يا صديقي',
        welcomeDesc: 'شكراً لثقتك في Moonlight 🌕. هذه صفحتك الخاصة — فيها كل ما تحتاجه من ملفات، تحديثات، ومعلومات طلبك.',
        orderInProgress: 'جاري التنفيذ',
        orderDetails: '✦ تفاصيل الطلب',
        productService: 'المنتج / الخدمة',
        orderDate: 'تاريخ الطلب',
        paymentStatus: 'حالة الدفع',
        paidSuccess: 'تم الدفع بنجاح',
        totalAmount: 'المبلغ الإجمالي',
        stages: '✦ مراحل تنفيذ الطلب',
        step1Title: 'استلام الطلب والدفع',
        step1Sub: 'تم استلام طلبك وتأكيد الدفع بنجاح',
        step2Title: 'جاري المعالجة',
        step2Sub: 'نعمل الآن على طلبك بكل حب وإتقان',
        step3Title: 'التسليم النهائي',
        step3Sub: 'طلبك جاهز للتحميل والاستخدام',
        completed: 'مكتمل',
        readyFiles: 'ملفاتك الجاهزة',
        liveSync: 'تزامن مباشر',
        finalFile: 'الملف النهائي',
        readyForUse: 'جاهز للتحميل والاستخدام الآن',
        downloadNow: 'اضغط هنا لتحميل ملفك',
        secureLink: 'رابط آمن ومفحوص من الفيروسات',
        filesProcessing: 'الملفات قيد التجهيز',
        processingDesc: 'نعمل على اللمسات الأخيرة لطلبك، سيتم تفعيل الرابط تلقائياً فور جاهزيته.',
        linkLocked: 'رابط التحميل مقفل حالياً',
        linkWillOpen: 'سيفتح رابط التحميل فور انتهاء المعالجة',
        instructions: '✦ تعليمات الاستخدام',
        instruction1: "قم بتحميل الملفات من قسم 'ملفاتك الجاهزة' أعلاه بمجرد اكتمال الطلب.",
        instruction2: 'افتح الملفات باستخدام البرامج المناسبة (Figma, Adobe, ZIP Extractors).',
        instruction3: 'اتبع الدليل المرفق مع الملفات للحصول على أفضل النتائج.',
        instruction4: 'في حال واجهت أي مشكلة، لا تتردد في مراسلتنا مباشرة.',
        contactMoonlight: 'تواصل مع Moonlight',
        haveQuestion: 'هل لديك استفسار أو تعديل؟ نحن هنا على مدار الساعة عبر الواتساب',
        madeBy: 'صنع بـ ✦ بواسطة',
        allRights: 'الهوية الرقمية الاحترافية · جميع الحقوق محفوظة 2024'
      },
      myOrders: {
        personalAccount: 'حسابي الشخصي',
        purchasedOrders: 'طلباتي المشتراة',
        purchased: 'المشتراة',
        description: 'هنا تجد جميع مشترياتك السابقة من Moonlight. يمكنك الوصول إلى بوابات التحميل الخاصة بك في أي وقت.',
        loading: 'جاري تحميل طلباتك...',
        noOrders: 'لا توجد طلبات بعد',
        noOrdersDesc: 'يبدو أنك لم تقم بأي عملية شراء باستخدام هذا البريد الإلكتروني ({{email}}).',
        exploreStore: 'استكشف المتجر الآن',
        test: 'تجريبي',
        orderNumber: 'رقم الطلب',
        completedReady: 'مكتمل وجاهز',
        inProgress: 'جاري التجهيز',
        openPortal: 'فتح البوابة',
        lostAccess: 'هل فقدت الوصول لطلب معين؟',
        lostAccessDesc: 'إذا قمت بشراء منتج ببريد إلكتروني مختلف، يمكنك استعادته يدوياً.',
        recoverLost: 'استعادة طلب مفقود'
      },
      recovery: {
        recoverAccess: 'استعادة الوصول للطلب',
        access: 'الوصول',
        description: 'أدخل بياناتك أدناه للعثور على رابط بوابة العميل الخاصة بك.',
        emailLabel: 'البريد الإلكتروني المستخدم عند الشراء',
        orderIdLabel: 'رقم الطلب (أو آخر 8 أرقام منه)',
        searchButton: 'ابحث عن طلبي',
        searching: 'جاري البحث...',
        notFound: 'لم نجد أي طلبات مرتبطة بهذا البريد الإلكتروني.',
        wrongData: 'لم نجد طلباً بهذا الرقم تحت هذا البريد الإلكتروني. يرجى التأكد من البيانات.',
        error: 'حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.',
        found: 'تم العثور على طلبك!',
        openPortal: 'فتح بوابة العميل'
      },
      auth: {
        welcome: 'مرحباً بك',
        loginDesc: 'سجل دخولك للوصول إلى لوحة التحكم أو متابعة مشترياتك في Moonlight 🌕',
        googleLogin: 'الدخول بواسطة جوجل',
        secureLogin: 'دخول آمن ومحمي',
        backToStore: 'العودة للمتجر',
        errorUnexpected: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
        errorPopup: 'تم حظر النافذة المنبثقة. يرجى السماح بالمنبثقات لهذا الموقع أو المحاولة من متصفح آخر.',
        errorDomain: 'هذا النطاق غير مصرح به في إعدادات Firebase.',
        errorNetwork: 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.',
        errorFailed: 'فشل تسجيل الدخول: {{message}}'
      },
      legal: {
        privacyTitle: 'سياسة الخصوصية',
        termsTitle: 'الشروط والأحكام',
        lastUpdate: 'آخر تحديث',
        p1Title: 'جمع المعلومات',
        p1Content: 'نحن في Moonlight 🌕 نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند استخدامك لخدماتنا، مثل الاسم، البريد الإلكتروني، ومعلومات الدفع عند إتمام عملية الشراء. نستخدم هذه المعلومات فقط لتقديم الخدمات المطلوبة وتحسين تجربة المستخدم.',
        p2Title: 'استخدام المعلومات',
        p2Content: 'نستخدم المعلومات التي نجمعها من أجل:',
        p2Item1: 'معالجة طلباتك وتوفير المنتجات الرقمية.',
        p2Item2: 'التواصل معك بخصوص طلباتك أو استفساراتك.',
        p2Item3: 'تحسين موقعنا وخدماتنا.',
        p2Item4: 'إرسال تحديثات أو عروض ترويجية (إذا وافقت على ذلك).',
        p3Title: 'حماية البيانات',
        p3Content: 'نحن نتخذ إجراءات أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف. نستخدم بوابات دفع آمنة (مثل PayPal) ولا نقوم بتخزين معلومات بطاقتك الائتمانية على خوادمنا.',
        p4Title: 'مشاركة المعلومات',
        p4Content: 'لا نقوم ببيع أو تأجير معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط مع مزودي الخدمات الذين يساعدوننا في تشغيل موقعنا (مثل بوابات الدفع) والذين يلتزمون بالحفاظ على سرية هذه المعلومات.',
        p5Title: 'حقوقك',
        p5Content: 'يحق لك طلب الوصول إلى معلوماتك الشخصية التي نحتفظ بها، أو طلب تصحيحها أو حذفها. يمكنك التواصل معنا في أي وقت لممارسة هذه الحقوق.',
        t1Title: 'قبول الشروط',
        t1Content: 'باستخدامك لموقع Moonlight 🌕 وشرائك لمنتجاتنا الرقمية، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام خدماتنا.',
        t2Title: 'المنتجات الرقمية',
        t2Content: 'جميع المنتجات المعروضة في المتجر هي منتجات رقمية (Digital Products) قابلة للتنزيل. لا يتم شحن أي منتجات مادية. بمجرد إتمام عملية الدفع بنجاح، ستحصل على رابط لتحميل الملفات مباشرة.',
        t3Title: 'سياسة الاسترداد (Refund Policy)',
        t3Content: 'نظراً لطبيعة المنتجات الرقمية التي لا يمكن إرجاعها بعد تحميلها، فإننا لا نقدم عمليات استرداد للأموال (No Refunds) بعد إتمام عملية الشراء وتحميل المنتج. يرجى قراءة وصف المنتج بعناية والتأكد من أنه يلبي احتياجاتك قبل الشراء.',
        t4Title: 'حقوق الملكية والاستخدام',
        t4Content: 'عند شرائك لأي قالب أو منتج رقمي من Moonlight، فإنك تحصل على ترخيص غير حصري لاستخدامه في مشاريعك الشخصية أو التجارية. يُمنع منعاً باتاً إعادة بيع، توزيع، أو مشاركة الملفات الأصلية مع أطراف أخرى بأي شكل من الأشكال.',
        t5Title: 'التعديلات على الشروط',
        t5Content: 'نحتفظ بالحق في تعديل أو تغيير هذه الشروط والأحكام في أي وقت دون إشعار مسبق. استمرارك في استخدام الموقع بعد أي تغييرات يُعد قبولاً منك للشروط الجديدة.'
      },
      bot: {
        welcome: 'مرحباً بك في Moonlight 🌕! أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟',
        clearChat: 'مسح المحادثة',
        smartAssistant: 'المساعد الذكي',
        poweredByAi: 'مدعوم بالذكاء الاصطناعي',
        thinking: 'يفكر...',
        placeholder: 'اسألني أي شيء...',
        whatsappLabel: 'تواصل معنا عبر واتساب',
        chatLabel: 'المساعد الذكي',
        name: 'مساعد Moonlight',
        status: 'متصل الآن',
        title: 'تحليل الذكاء الاصطناعي',
        description: 'دع الذكاء الاصطناعي يحلل أداء متجرك ويقترح عليك خطوات للنمو.',
        reAnalyze: 'إعادة التحليل',
        ready: 'جاهز لتحليل بيانات المتجر...',
        startAnalysis: 'ابدأ التحليل الذكي',
        assistantTitle: 'مساعد Moonlight الذكي',
        assistantDesc: 'اسألني عن أي شيء يخص إدارة المتجر',
        startChat: 'ابدأ المحادثة الآن للحصول على مساعدة فورية',
        errorTechnical: 'عذراً، حدث خطأ تقني. يمكنك التواصل معنا عبر الواتساب مباشرة.',
        errorPermission: 'خطأ: ليس لديك صلاحية للوصول إلى الذكاء الاصطناعي. يرجى التأكد من صحة مفتاح API وتفعيل Generative Language API.',
        errorInvalidKey: 'خطأ: مفتاح API الخاص بالذكاء الاصطناعي غير صالح أو مفقود.',
        errorQuota: 'عذراً، تم تجاوز حصة الاستخدام اليومية للذكاء الاصطناعي.',
        errorGeneric: 'خطأ تقني: {{message}}'
      }
    }
  },
  en: {
    translation: {
      nav: {
        home: 'Home',
        orders: 'My Orders',
        protection: 'Buyer Protection',
        dashboard: 'Dashboard',
        login: 'Login',
        logout: 'Logout'
      },
      hero: {
        subtitle: 'Moonlight Digital Studio',
        title: 'Your Digital Identity',
        titleAccent: 'Professionally',
        description: 'We design a digital future that exceeds expectations. From visual identity to web development, we are here to create an unforgettable presence for you.',
        browseProducts: 'Browse Products',
        ourServices: 'Our Services',
        searchPlaceholder: 'Ask Moonlight for the right product for your project...',
        videoFallback: 'Your browser does not support the video tag.',
        categories: {
          all: 'All',
          cv: 'CV Templates',
          social: 'Social Media',
          web: 'Web Dev',
          other: 'Other'
        }
      },
      footer: {
        description: 'We believe every idea deserves to be presented in the best possible way. Moonlight is your partner in the digital success journey.',
        quickLinks: 'Quick Links',
        contactUs: 'Contact Us',
        contact: 'Contact Moonlight',
        contactDesc: 'Do you have a project idea? Or need technical help? Our team is ready to respond immediately.',
        terms: 'Terms & Conditions',
        privacy: 'Privacy Policy',
        recover: 'Recover Order'
      },
      common: {
        loading: 'Loading...',
        error: 'Something went wrong',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit'
      },
      protection: {
        header: {
          badge: 'Buyer Protection Protocol',
          title: 'Guarantee and Protection Guide',
          titleAccent: 'Your Purchases in Moonlight',
          description: 'Dear customer, at Moonlight your privacy and technical rights are our priority. We guarantee safe and permanent access to everything you buy.'
        },
        protocols: [
          {
            title: "'My Orders' System (Permanent Reference)",
            desc: 'Once the purchase is completed while you are logged in, the package is automatically archived in your account.',
            details: [
              'How to find it? Go to your personal account menu > Choose "My Orders".',
              'Feature: You will find a list of all your previous purchases with direct links to their entry portals, available to you at any time and from any device.'
            ]
          },
          {
            title: 'Instant Documentation (Customer Portal)',
            desc: 'Immediately after a successful payment, you are directed straight to your customer portal.',
            details: [
              'Content: The portal contains invoice details, implementation stages, and download links.',
              'Tip: Keep the portal link or order number as a permanent reference for you.'
            ]
          },
          {
            title: 'Order Recovery Feature (Emergency)',
            desc: 'In case you lose access to your order or close the page by mistake, we provided the "Recover Order" page.',
            details: [
              'All you need is to enter (your email + order number) and the system will immediately redirect you to your purchased package.'
            ]
          },
          {
            title: 'Direct Technical Support',
            desc: 'Our team is available to serve you via the WhatsApp icon at the bottom of the site.',
            details: [
              'Never have to pay twice; once the transaction number is verified in our dashboard, you will be provided with the link manually immediately.'
            ]
          }
        ],
        advice: {
          title: '💡 Tip for the Best Experience',
          desc: 'Please always ensure you are logged in before the purchase process to guarantee linking the package to your account immediately, and ensure your email is correct to receive access links quickly.',
          buttonOrders: 'Browse My Orders Now',
          buttonHome: 'Back to Store',
          footer: 'Your rights are reserved, and your journey with us is completely safe. 🌙✨'
        }
      },
      products: {
        title: 'Digital Products',
        description: 'Ready-to-use templates and tools to elevate your work quality',
        comingSoonTitle: 'Coming Soon to Moonlight',
        comingSoonDesc: 'We are currently preparing exceptional digital products that will change the game. Be ready!',
        viewDetails: 'View Details',
        aiRecommended: 'AI RECOMMENDED',
        notFound: 'Product not found',
        errorLoading: 'Error loading product',
        backToStore: 'Back to Store',
        premiumDigital: 'Premium Digital Product',
        securePayment: 'Secure and protected payment. You will get the download link immediately and automatically after completing the process.',
        thanks: 'Thanks for your trust!',
        paymentConfirmed: 'Payment confirmed, you can download now',
        downloadFiles: 'Download Files',
        category: 'Category',
        delivery: 'Delivery',
        instant: 'Instant',
        aiInsights: 'Moonlight Smart Analysis',
        aiInsightsDesc: 'Discover how this product will help you in your project',
        aiVision: 'AI Vision',
        creativeSummary: 'Creative Summary',
        targetAudience: 'Target Audience',
        proTip: 'Moonlight Tip',
        bestUseCases: 'Best Use Cases'
      },
      services: {
        title: 'Our Professional Services',
        description: 'Integrated digital solutions tailored for your business growth',
        startFrom: 'Starts from',
        orderNow: 'Order Now',
        comingSoon: 'New services coming soon...',
        notFound: 'Service not found',
        errorLoading: 'Error loading service',
        professionalService: 'Professional Service',
        securePayment: 'Secure and protected payment. After completing the payment, we will contact you to start implementing the service.',
        orderReceived: 'Order received!',
        thanks: 'Thanks for your trust. We will contact you via your email very soon.',
        downloadAttached: 'Download Attached Files',
        contactWhatsapp: 'Contact us via WhatsApp',
        backToHome: 'Back to Home',
        serviceType: 'Service Type',
        professional: 'Professional',
        paymentMethod: 'Payment Method',
        secure: 'Secure',
        aiInsightsDesc: 'Discover how this service will benefit you in your project',
        addedValue: 'Added Value'
      },
      orderPortal: {
        notFound: 'Order not found',
        errorLoading: 'Error loading order data',
        checkLink: 'Make sure the link is correct or contact technical support for help.',
        backToStore: 'Back to Store',
        customerPortal: '✦ Private Customer Portal',
        welcome: 'Welcome',
        friend: 'my friend',
        welcomeDesc: 'Thanks for your trust in Moonlight 🌕. This is your private page — it has everything you need from files, updates, and your order information.',
        orderInProgress: 'In Progress',
        orderDetails: '✦ Order Details',
        productService: 'Product / Service',
        orderDate: 'Order Date',
        paymentStatus: 'Payment Status',
        paidSuccess: 'Paid Successfully',
        totalAmount: 'Total Amount',
        stages: '✦ Order Implementation Stages',
        step1Title: 'Order Received & Payment',
        step1Sub: 'Your order has been received and payment confirmed successfully',
        step2Title: 'Processing',
        step2Sub: 'We are now working on your order with love and perfection',
        step3Title: 'Final Delivery',
        step3Sub: 'Your order is ready for download and use',
        completed: 'Completed',
        readyFiles: 'Your Ready Files',
        liveSync: 'Live Sync',
        finalFile: 'Final File',
        readyForUse: 'Ready for download and use now',
        downloadNow: 'Click here to download your file',
        secureLink: 'Secure link and scanned for viruses',
        filesProcessing: 'Files are being processed',
        processingDesc: 'We are working on the final touches for your order, the link will be activated automatically as soon as it is ready.',
        linkLocked: 'Download link is currently locked',
        linkWillOpen: 'The download link will open as soon as processing is complete',
        instructions: '✦ Usage Instructions',
        instruction1: "Download the files from the 'Your Ready Files' section above once the order is complete.",
        instruction2: 'Open the files using the appropriate programs (Figma, Adobe, ZIP Extractors).',
        instruction3: 'Follow the guide attached with the files for the best results.',
        instruction4: 'In case you encounter any problem, do not hesitate to contact us directly.',
        contactMoonlight: 'Contact Moonlight',
        haveQuestion: 'Do you have a question or modification? We are here around the clock via WhatsApp',
        madeBy: 'Made with ✦ by',
        allRights: 'Professional Digital Identity · All Rights Reserved 2024'
      },
      myOrders: {
        personalAccount: 'My Personal Account',
        purchasedOrders: 'My Purchased Orders',
        purchased: 'Purchased',
        description: 'Here you find all your previous purchases from Moonlight. You can access your download portals at any time.',
        loading: 'Loading your orders...',
        noOrders: 'No orders yet',
        noOrdersDesc: 'It seems you haven\'t made any purchase using this email ({{email}}).',
        exploreStore: 'Explore the Store Now',
        test: 'Test',
        orderNumber: 'Order Number',
        completedReady: 'Completed & Ready',
        inProgress: 'In Progress',
        openPortal: 'Open Portal',
        lostAccess: 'Lost access to a specific order?',
        lostAccessDesc: 'If you purchased a product with a different email, you can recover it manually.',
        recoverLost: 'Recover Lost Order'
      },
      recovery: {
        recoverAccess: 'Recover Order Access',
        access: 'Access',
        description: 'Enter your details below to find your customer portal link.',
        emailLabel: 'Email used during purchase',
        orderIdLabel: 'Order number (or last 8 digits of it)',
        searchButton: 'Search for my order',
        searching: 'Searching...',
        notFound: 'We didn\'t find any orders associated with this email.',
        wrongData: 'We didn\'t find an order with this number under this email. Please check the data.',
        error: 'An error occurred during search. Please try again later.',
        found: 'Your order has been found!',
        openPortal: 'Open Customer Portal'
      },
      auth: {
        welcome: 'Welcome',
        loginDesc: 'Log in to access the dashboard or track your purchases in Moonlight 🌕',
        googleLogin: 'Login with Google',
        secureLogin: 'Secure and protected login',
        backToStore: 'Back to Store',
        errorUnexpected: 'An unexpected error occurred. Please try again.',
        errorPopup: 'Popup blocked. Please allow popups for this site or try another browser.',
        errorDomain: 'This domain is not authorized in Firebase settings.',
        errorNetwork: 'Network connection error. Please check your internet connection.',
        errorFailed: 'Login failed: {{message}}'
      },
      legal: {
        privacyTitle: 'Privacy Policy',
        termsTitle: 'Terms and Conditions',
        lastUpdate: 'Last Update: {{date}}',
        privacy: {
          s1Title: '1. Information Collection',
          s1Content: 'We at Moonlight 🌕 collect information that you provide directly to us when using our services, such as name, email, and payment information when completing a purchase. We use this information only to provide the requested services and improve the user experience.',
          s2Title: '2. Information Use',
          s2Content: 'We use the information we collect to:',
          s2Item1: 'Process your orders and provide digital products.',
          s2Item2: 'Communicate with you regarding your orders or inquiries.',
          s2Item3: 'Improve our site and services.',
          s2Item4: 'Send updates or promotional offers (if you agree).',
          s3Title: '3. Data Protection',
          s3Content: 'We take appropriate security measures to protect your personal information from unauthorized access, modification, disclosure, or destruction. We use secure payment gateways (such as PayPal) and do not store your credit card information on our servers.',
          s4Title: '4. Information Sharing',
          s4Content: 'We do not sell or rent your personal information to third parties. We may share your information only with service providers who help us operate our site (such as payment gateways) and who are committed to maintaining the confidentiality of this information.',
          s5Title: '5. Your Rights',
          s5Content: 'You have the right to request access to your personal information that we hold, or request its correction or deletion. You can contact us at any time to exercise these rights.'
        },
        terms: {
          s1Title: '1. Acceptance of Terms',
          s1Content: 'By using the Moonlight 🌕 site and purchasing our digital products, you agree to be bound by these terms and conditions. If you do not agree to any part of these terms, please do not use our services.',
          s2Title: '2. Digital Products',
          s2Content: 'All products displayed in the store are downloadable digital products. No physical products are shipped. Once the payment process is successful, you will receive a link to download the files directly.',
          s3Title: '3. Refund Policy',
          s3Content: 'Due to the nature of digital products that cannot be returned after downloading, we do not offer refunds after the purchase process and product download are complete. Please read the product description carefully and ensure it meets your needs before purchasing.',
          s4Title: '4. Ownership and Usage Rights',
          s4Content: 'When you purchase any template or digital product from Moonlight, you get a non-exclusive license to use it in your personal or commercial projects. It is strictly forbidden to resell, distribute, or share the original files with other parties in any form.',
          s5Title: '5. Modifications to Terms',
          s5Content: 'We reserve the right to modify or change these terms and conditions at any time without prior notice. Your continued use of the site after any changes constitutes your acceptance of the new terms.'
        }
      },
      bot: {
        welcome: 'Welcome to Moonlight 🌕! I am your smart assistant, how can I help you today?',
        clearChat: 'Clear Chat',
        smartAssistant: 'Smart Assistant',
        poweredByAi: 'Powered by AI',
        thinking: 'Thinking...',
        placeholder: 'Ask me anything...',
        whatsappLabel: 'Contact us via WhatsApp',
        errorTechnical: 'Sorry, a technical error occurred. You can contact us via WhatsApp directly.',
        errorPermission: 'Error: You do not have permission to access AI. Please ensure the API key is correct and Generative Language API is enabled.',
        errorInvalidKey: 'Error: The AI API key is invalid or missing.',
        errorQuota: 'Sorry, the daily AI usage quota has been exceeded.',
        errorGeneric: 'Technical error: {{message}}'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
