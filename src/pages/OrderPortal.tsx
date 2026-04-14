import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Clock, 
  Download, 
  MessageSquare, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  Package, 
  Calendar, 
  CreditCard,
  ExternalLink,
  ChevronLeft,
  Lock
} from 'lucide-react';

const Stars = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${i % 5 === 0 ? 'bg-green-400/40' : 'bg-white/30'}`}
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default function OrderPortal() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const prevStatus = useRef<string | null>(null);

  const fallbackLogo = "https://i.ibb.co/6cJ5wS0h/nf9gthbcbxrmw0cxg8993rpk28-result-0.png";

  useEffect(() => {
    // Fetch Logo
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'appearance'));
        if (settingsDoc.exists()) {
          setLogoUrl(settingsDoc.data().logoUrl || '');
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOrder({ id: docSnap.id, ...data });
        
        // Trigger confetti if status just changed to completed
        if (data.status === 'completed' && prevStatus.current !== 'completed') {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00D2FF', '#B2FF05', '#ffffff']
          });
        }
        prevStatus.current = data.status;
      } else {
        setError("الطلب غير موجود");
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("خطأ في تحميل بيانات الطلب");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-dark text-center py-40 space-y-6 px-6">
        <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <Lock className="text-red-500" size={36} />
        </div>
        <h2 className="text-3xl font-black text-white">{error || "عذراً، لم نتمكن من العثور على الطلب"}</h2>
        <p className="text-gray-500 max-w-md mx-auto">تأكد من صحة الرابط أو تواصل مع الدعم الفني لمساعدتك.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-bold">
          <ArrowLeft size={20} />
          العودة للمتجر
        </Link>
      </div>
    );
  }

  const steps = [
    { id: 'payment', title: 'استلام الطلب والدفع', sub: 'تم استلام طلبك وتأكيد الدفع بنجاح', date: order.createdAt?.toDate().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }) },
    { id: 'processing', title: 'جاري التجهيز', sub: 'نعمل الآن على طلبك بكل حب وإتقان', date: 'قيد التنفيذ' },
    { id: 'completed', title: 'التسليم النهائي', sub: 'طلبك جاهز للتحميل والاستخدام', date: 'قريباً' }
  ];

  const getStepStatus = (stepId: string) => {
    const status = order.status || 'pending';
    if (status === 'completed') return 'done';
    if (status === 'processing') {
      if (stepId === 'payment') return 'done';
      if (stepId === 'processing') return 'active';
      return 'pending';
    }
    // pending
    if (stepId === 'payment') return 'active';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-white pb-20 relative overflow-hidden">
      {/* Noise Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      {/* Aurora Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-primary/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-purple-500/10 blur-[100px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            x: [0, 50, 0],
            y: [0, -100, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] bg-green-500/5 blur-[100px] rounded-full" 
        />
        <Stars />
      </div>

      <div className="max-w-3xl mx-auto px-6 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between py-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/5 overflow-hidden border border-white/5">
              <img 
                src={logoUrl || fallbackLogo} 
                alt="Moonlight" 
                className="h-full w-full object-contain" 
                onError={(e) => {
                  e.currentTarget.src = fallbackLogo;
                }}
              />
            </div>
            <span className="text-lg font-black tracking-widest uppercase text-white group-hover:text-primary transition-colors">
              Moonlight 
              <motion.span 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block mr-2"
              >
                🌕
              </motion.span>
            </span>
          </Link>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-1.5 rounded-full text-[10px] font-black text-green-500 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            جاري التنفيذ
          </div>
        </header>

        {/* Hero */}
        <div className="py-10 space-y-4">
          <span className="text-gold text-xs font-black uppercase tracking-[0.3em] block">✦ بوابة العميل الخاصة</span>
          <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter">
            أهلاً بك<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">
              {order.customerName || order.customerEmail?.split('@')[0] || 'يا صديقي'} 👋
            </span>
          </h1>
          <p className="text-white/70 text-lg font-medium max-w-lg leading-relaxed">
            شكراً لثقتك بـ <span className="text-primary font-black">Moonlight 🌕</span>. هذه صفحتك الخاصة — فيها كل ما تحتاجه من ملفات وتحديثات ومعلومات طلبك.
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />

        {/* Order Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors" />
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">✦ تفاصيل الطلب</span>
              <span className="text-sm font-mono text-gold font-black bg-gold/10 px-3 py-1 rounded-lg border border-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                #{order.paypalOrderId?.slice(-8) || order.id.slice(-8)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-sm text-white/80 font-medium">المنتج / الخدمة</span>
                  <span className="text-sm font-bold text-white">{order.productName || order.serviceTitle}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-sm text-white/80 font-medium">تاريخ الطلب</span>
                  <span className="text-sm font-bold text-white">
                    {order.createdAt?.toDate().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-sm text-white/80 font-medium">حالة الدفع</span>
                  <span className="text-sm font-bold text-green-400 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    تم الدفع بنجاح
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-sm text-white/80 font-medium">المبلغ الإجمالي</span>
                  <span className="text-lg font-black text-white tracking-tighter">${order.amount}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Tracker */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10"
        >
          <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em] block mb-8">✦ مراحل تنفيذ طلبك</span>
          
          <div className="space-y-0 relative">
            {steps.map((step, idx) => {
              const status = getStepStatus(step.id);
              return (
                <div key={step.id} className="flex gap-6 relative pb-10 last:pb-0">
                  {idx !== steps.length - 1 && (
                    <div className={`absolute right-[17px] top-10 bottom-0 w-0.5 ${status === 'done' ? 'bg-primary' : 'bg-white/10'}`} />
                  )}
                  
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-500 ${
                    status === 'done' ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' :
                    status === 'active' ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400 animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.4)]' :
                    'bg-white/5 border-2 border-white/10 text-white/20'
                  }`}>
                    {status === 'done' ? <CheckCircle2 size={18} /> : 
                     status === 'active' ? <Clock size={18} className="animate-spin-slow" /> : 
                     <span className="text-xs font-black">{idx + 1}</span>}
                  </div>

                  <div className="flex-1 pt-1">
                    <h3 className={`font-black text-lg ${status === 'pending' ? 'text-white/20' : 'text-white'}`}>{step.title}</h3>
                    <p className="text-sm text-white/60 font-medium mt-1">{step.sub}</p>
                    {status === 'done' && <span className="text-[10px] text-green-400 font-black mt-2 block tracking-widest uppercase">✓ مكتمل — {step.date}</span>}
                    {status === 'active' && <span className="text-[10px] text-purple-400 font-black mt-2 block tracking-widest uppercase animate-pulse">⟳ قيد التنفيذ</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Downloads & Files */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Zap size={14} className="animate-pulse" />
              ملفاتك الجاهزة
            </span>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Live Sync</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {order.status === 'completed' ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl flex flex-col items-center text-center space-y-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-3xl flex items-center justify-center text-green-400 shadow-2xl border border-green-500/20 relative z-10">
                    <Package size={48} className="group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className="text-2xl font-black text-white">الملف النهائي</h4>
                    <p className="text-sm text-gray-500 font-medium">جاهز للتحميل والاستخدام الآن</p>
                  </div>
                </div>

                <motion.a 
                  href={order.downloadUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02, translateY: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-8 bg-gradient-to-r from-green-600 to-green-400 text-black rounded-[2rem] flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(34,197,94,0.3)] group transition-all"
                >
                  <span className="text-2xl font-black tracking-tight">اضغط هنا لتحميل ملفك</span>
                  <Download size={28} className="animate-bounce" />
                </motion.a>
                
                <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <ShieldCheck size={12} className="text-green-500" />
                  رابط آمن ومفحوص ضد الفيروسات
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="bg-black/20 border border-dashed border-white/10 p-12 rounded-3xl text-center space-y-6 grayscale opacity-60">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600 relative">
                    <Lock size={32} />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-gray-400">الملفات قيد التجهيز</h4>
                    <p className="text-sm text-gray-600 font-medium max-w-xs mx-auto">نحن نعمل على اللمسات الأخيرة لطلبك، سيتم تفعيل الرابط تلقائياً فور الجاهزية.</p>
                  </div>
                </div>
                
                <div className="w-full py-8 bg-white/5 border border-white/10 text-white/20 rounded-[2rem] flex items-center justify-center gap-4 cursor-not-allowed">
                  <span className="text-xl font-black tracking-tight">رابط التحميل مقفل حالياً</span>
                  <Lock size={24} />
                </div>
                
                <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse">
                  <Clock size={12} />
                  سيفتح رابط التحميل فور اكتمال التجهيز
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-10"
        >
          <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em] block mb-6">✦ تعليمات الاستخدام</span>
          <ul className="space-y-4">
            {[
              "حمّل الملفات من قسم 'ملفاتك الجاهزة' أعلاه بمجرد اكتمال الطلب.",
              "افتح الملفات باستخدام البرامج المناسبة (Figma, Adobe, ZIP Extractors).",
              "اتبع الدليل المرفق مع الملفات للحصول على أفضل النتائج.",
              "في حال واجهت أي مشكلة، لا تتردد في التواصل معنا مباشرة."
            ].map((text, i) => (
              <li key={i} className="flex gap-4 text-sm text-white/60 font-medium leading-relaxed">
                <span className="w-6 h-6 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-[10px] font-black text-primary flex-shrink-0">{i + 1}</span>
                {text}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Support Card */}
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => window.open('https://wa.me/96569929627', '_blank')}
          className="mt-8 w-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-[2.5rem] p-8 flex items-center gap-6 hover:border-primary/60 transition-all group text-right shadow-[0_20px_40px_rgba(var(--primary-rgb),0.1)]"
        >
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform border border-white/10 shadow-lg shadow-primary/20">
            <MessageSquare size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-white">تواصل مع Moonlight</h3>
            <p className="text-sm text-white/80 font-medium mt-1">هل لديك سؤال أو تعديل؟ نحن هنا على مدار الساعة عبر واتساب</p>
          </div>
          <ChevronLeft className="text-primary group-hover:-translate-x-2 transition-transform" size={24} />
        </motion.button>

        {/* Footer */}
        <footer className="mt-20 text-center space-y-4 opacity-50">
          <p className="text-xs font-medium text-gray-500">صُنع بـ ✦ بواسطة <span className="text-primary font-black">Moonlight 🌕</span></p>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black">هوية رقمية باحترافية · جميع الحقوق محفوظة ٢٠٢٤</p>
        </footer>
      </div>
    </div>
  );
}
