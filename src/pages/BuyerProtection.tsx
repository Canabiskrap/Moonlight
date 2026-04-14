import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  ShoppingBag, 
  Mail, 
  RefreshCw, 
  MessageCircle, 
  Lock,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BuyerProtection() {
  const protocols = [
    {
      icon: <ShoppingBag className="text-primary" size={32} />,
      title: "نظام 'طلباتي' (المرجع الدائم)",
      desc: "بمجرد إتمام عملية الشراء وأنت مسجل دخولك، يتم أرشفة الحزمة تلقائياً في حسابك.",
      details: [
        "كيف تجدها؟ توجه إلى قائمة حسابك الشخصي > اختر 'طلباتي'.",
        "الميزة: ستجد قائمة بجميع مشترياتك السابقة مع روابط مباشرة لبوابات الدخول الخاصة بها، متاحة لك في أي وقت ومن أي جهاز."
      ]
    },
    {
      icon: <Lock className="text-primary" size={32} />,
      title: "التوثيق الفوري (بوابة العميل)",
      desc: "فور نجاح عملية الدفع، يتم توجيهك مباشرة إلى بوابة العميل الخاصة بك.",
      details: [
        "المحتوى: تحتوي البوابة على تفاصيل الفاتورة، مراحل التنفيذ، وروابط التحميل.",
        "نصيحة: احتفظ برابط البوابة أو رقم الطلب كمرجع دائم لك."
      ]
    },
    {
      icon: <RefreshCw className="text-primary" size={32} />,
      title: "خاصية استعادة الطلب (الطوارئ)",
      desc: "في حال فقدت الوصول لطلبك أو أغلق الصفحة بالخطأ، وفرنا لك صفحة 'استعادة الطلب'.",
      details: [
        "كل ما تحتاجه هو إدخال (بريدك الإلكتروني + رقم الطلب) وسيقوم النظام فوراً بإعادة توجيهك إلى حزمتك المشتراة."
      ]
    },
    {
      icon: <MessageCircle className="text-primary" size={32} />,
      title: "الدعم الفني المباشر",
      desc: "فريقنا متواجد لخدمتك عبر أيقونة WhatsApp الموجودة أسفل الموقع.",
      details: [
        "لا تضطر أبداً للدفع مرتين؛ فبمجرد التحقق من رقم العملية في لوحة التحكم لدينا، يتم تزويدك بالرابط يدوياً فوراً."
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-10">
      <header className="text-center mb-20 space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-primary/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-2xl shadow-primary/10"
        >
          <ShieldCheck className="text-primary" size={48} />
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
          دليل ضمان وحماية <br />
          <span className="text-primary">مشترياتك في Moonlight</span>
        </h1>
        <p className="text-gray-500 text-xl max-w-2xl mx-auto leading-relaxed">
          عزيزنا العميل، في Moonlight خصوصيتك وحقوقك التقنية هي أولويتنا. نحن نضمن لك وصولاً آمناً ودائماً لكل ما تشتريه.
        </p>
      </header>

      <div className="grid gap-8">
        {protocols.map((p, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
                {p.icon}
              </div>
              <div className="space-y-6 flex-1">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gold group-hover:text-white transition-colors duration-500">{p.title}</h3>
                  <p className="text-gray-400 font-medium text-lg leading-relaxed">{p.desc}</p>
                </div>
                <ul className="space-y-3">
                  {p.details.map((detail, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gold font-black leading-relaxed bg-gold/5 p-4 rounded-2xl border border-gold/10">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0 animate-pulse" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 rounded-[3rem] p-10 md:p-16 text-center space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        
        <div className="space-y-4 relative z-10">
          <h2 className="text-3xl font-black text-white">💡 نصيحة لضمان أفضل تجربة</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            يرجى دائماً التأكد من تسجيل الدخول قبل عملية الشراء لضمان ربط الحزمة بحسابك فوراً، والتأكد من صحة بريدك الإلكتروني لاستلام روابط الوصول بسرعة.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 relative z-10">
          <Link 
            to="/my-orders"
            className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform flex items-center gap-2 shadow-xl shadow-primary/20"
          >
            تصفح طلباتي الآن
            <ChevronLeft size={24} />
          </Link>
          <Link 
            to="/"
            className="bg-white/5 hover:bg-white/10 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center gap-2 border border-white/10"
          >
            العودة للمتجر
            <ArrowRight size={24} />
          </Link>
        </div>

        <p className="text-primary font-black text-xl pt-4">حقوقك محفوظة، ورحلتك معنا آمنة تماماً. 🌙✨</p>
      </div>
    </div>
  );
}
