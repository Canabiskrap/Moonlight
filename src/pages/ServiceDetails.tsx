import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { convertDriveLink } from '../lib/utils';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Loader2, Zap, MessageSquare, CreditCard, Download, Brain, Target } from 'lucide-react';
import { getProductInsights, ProductInsight } from '../services/geminiService';
import PayPalButton from '../components/PayPalButton';

export default function ServiceDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<ProductInsight | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const handleGetAiInsights = async () => {
    if (!service || loadingAi) return;
    setLoadingAi(true);
    try {
      const insights = await getProductInsights({
        name: service.title,
        description: service.description,
        category: 'Service',
        price: service[`price${selectedCurrency}`] || service.price || 0
      });
      setAiInsights(insights);
    } catch (err) {
      console.error("Failed to get AI insights", err);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'services', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError(t('services.notFound'));
        }
      } catch (err) {
        console.error(err);
        setError(t('services.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold mr-4">جاري التحميل...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="text-center py-40 space-y-6">
        <h2 className="text-3xl font-bold text-gray-400">{error || 'الخدمة غير موجودة'}</h2>
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowRight size={20} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
          العودة للمتجر
        </Link>
      </div>
    );
  }

  const currentPrice = service[`price${selectedCurrency}`] || service.price || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative"
    >
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-12 relative z-10">
        {/* Image Side */}
        <div className="space-y-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-all mb-4 group">
            <ArrowRight size={18} className={`${i18n.language === 'ar' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} />
            <span className="font-bold">العودة للمتجر</span>
          </Link>
          
          <div className="glass-card rounded-[3rem] overflow-hidden group relative aspect-[4/5] bg-dark-surface flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 z-10" />
            {service.imageUrl ? (
              <img 
                src={convertDriveLink(service.imageUrl)} 
                alt={service.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
                }}
              />
            ) : (
              <div className="text-9xl">{service.icon || '🎨'}</div>
            )}
            
            <div className="absolute top-8 right-8 z-20 flex flex-col items-end gap-2">
              <div className="gold-capsule text-sm px-6 py-2">{currentPrice} {selectedCurrency}</div>
              <div className="relative">
                <select 
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="bg-black/50 backdrop-blur-md text-[10px] p-2 rounded-xl border border-white/10 appearance-none pl-8 pr-4 text-white font-bold"
                >
                  <option value="SAR">SAR</option>
                  <option value="KWD">KWD</option>
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                </select>
                <Brain size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gold pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Details Side */}
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gold">
              <Sparkles size={12} />
              خدمة احترافية
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tighter text-glow animate-heartbeat-glow" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>{service.title}</h1>
            <p className="text-gray-400 text-lg sm:text-xl leading-relaxed font-medium text-right sm:text-justify">{service.description}</p>
          </div>

          <div className="glass-card p-6 sm:p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="flex items-center gap-4 text-green-400 bg-green-400/5 p-6 rounded-2xl border border-green-400/10">
              <ShieldCheck size={28} />
              <p className="font-bold text-sm leading-relaxed">دفع آمن ومحمي. بعد إتمام الدفع، سنتواصل معك للبدء في تنفيذ الخدمة.</p>
            </div>

            {!paid ? (
              <div className="space-y-6">
                <PayPalButton 
                  item={service} 
                  type="service" 
                  currency={selectedCurrency} 
                  price={currentPrice} 
                  onSuccess={(orderId) => {
                    setPaid(true);
                    setTimeout(() => navigate(`/order-portal/${orderId}`), 2000);
                  }} 
                />
                <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  Secure Payment via PayPal Global
                </p>
              </div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-primary/5 border border-primary/20 p-10 rounded-[2rem] text-center space-y-6"
              >
                <div className="bg-green-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/40 animate-bounce">
                  <CheckCircle2 className="text-white" size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-white">تم استلام الطلب!</h3>
                  <p className="text-gray-400 font-medium">شكراً لثقتك. سنتواصل معك عبر بريدك الإلكتروني قريباً جداً.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => window.open('https://www.instagram.com/moonlight_eb.kw?igsh=czYzc2thY3p5NGs2', '_blank')}
                    className="btn-premium flex items-center justify-center gap-3 bg-green-500 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-green-500/10"
                  >
                    <MessageSquare size={20} />
                    تواصل معنا عبر إنستغرام
                  </button>
                  <Link 
                    to="/"
                    className="text-gray-500 hover:text-white font-bold text-sm transition-colors"
                  >
                    العودة للرئيسية
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl text-center space-y-1">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">نوع الخدمة</p>
              <p className="font-black text-gold text-lg">احترافية</p>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center space-y-1">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">طريقة الدفع</p>
              <p className="font-black text-green-400 text-lg">آمنة</p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="pt-4">
            {!aiInsights ? (
              <button
                onClick={handleGetAiInsights}
                disabled={loadingAi}
                className="w-full flex items-center justify-center gap-4 bg-white/5 hover:bg-white/10 p-8 rounded-[2.5rem] border border-white/10 transition-all group disabled:opacity-50"
              >
                {loadingAi ? (
                  <Loader2 className="animate-spin text-primary" size={28} />
                ) : (
                  <>
                    <Brain className="text-primary group-hover:scale-110 transition-transform" size={28} />
                    <div className="text-right">
                      <p className="text-lg font-black text-white">تحليل Moonlight الذكي</p>
                      <p className="text-xs text-gray-500 font-medium">اكتشف كيف ستفيدك هذه الخدمة في مشروعك</p>
                    </div>
                  </>
                )}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-10 rounded-[3rem] border-primary/20 space-y-8 relative overflow-hidden"
              >
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="bg-primary/20 p-3 rounded-2xl">
                    <Sparkles className="text-primary" size={24} />
                  </div>
                  <h3 className="text-2xl font-black">رؤية الذكاء الاصطناعي</h3>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gold">
                      <Brain size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">ملخص إبداعي</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed font-medium text-right">{aiInsights.creativeSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Zap size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">القيمة المضافة</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed font-medium text-right">{aiInsights.targetAudience}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">نصيحة Moonlight</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed font-medium text-right">{aiInsights.proTip}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
