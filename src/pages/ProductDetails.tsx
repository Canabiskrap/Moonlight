import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { convertDriveLink } from '../lib/utils';
import { motion } from 'motion/react';
import { ArrowRight, Download, ShieldCheck, Sparkles, ExternalLink, Brain, Target, Lightbulb, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { getProductInsights, ProductInsight } from '../services/geminiService';
import PayPalButton from '../components/PayPalButton';

export default function ProductDetails() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<ProductInsight | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const handleGetAiInsights = async () => {
    if (!product || loadingAi) return;
    setLoadingAi(true);
    try {
      const insights = await getProductInsights(product);
      setAiInsights(insights);
    } catch (err) {
      console.error("Failed to get AI insights", err);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError(t('products.notFound'));
        }
      } catch (err) {
        console.error(err);
        setError(t('products.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold mr-4">جاري التحميل...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-40 space-y-6">
        <h2 className="text-3xl font-bold text-gray-400">{error || 'المنتج غير موجود'}</h2>
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowRight size={20} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
          العودة للمتجر
        </Link>
      </div>
    );
  }

  const currentPrice = product[`price${selectedCurrency}`] || product.price || 0;

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
            <img 
              src={convertDriveLink(product.imageUrl)} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
              }}
            />
            
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
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
              <Zap size={12} />
              منتج رقمي مميز
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tighter text-glow animate-heartbeat-glow" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>{product.name}</h1>
            <p className="text-gray-400 text-lg sm:text-xl leading-relaxed font-medium text-right sm:text-justify">{product.description}</p>
          </div>

          <div className="glass-card p-6 sm:p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="flex items-center gap-4 text-green-400 bg-green-400/5 p-6 rounded-2xl border border-green-400/10">
              <ShieldCheck size={28} />
              <p className="font-bold text-sm leading-relaxed">دفع آمن ومحمي. ستحصل على رابط التحميل فوراً وتلقائياً بعد إتمام العملية.</p>
            </div>

            {!paid ? (
              <div className="space-y-6">
                <PayPalButton 
                  item={product} 
                  type="product" 
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
                <div className="bg-primary w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-primary/40 animate-bounce">
                  <Download className="text-white" size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-white">شكراً لثقتك!</h3>
                  <p className="text-gray-400 font-medium">تم تأكيد الدفع، جاري توجيهك لبوابة التحميل...</p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl text-center space-y-1">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">الفئة</p>
              <p className="font-black text-gold text-lg">{product.category}</p>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center space-y-1">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">التسليم</p>
              <p className="font-black text-green-400 text-lg">فوري</p>
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
                      <p className="text-xs text-gray-500 font-medium">اكتشف كيف سيساعدك هذا المنتج في مشروعك</p>
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
                        <Target size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">الجمهور المستهدف</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed font-medium text-right">{aiInsights.targetAudience}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-400">
                        <Lightbulb size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">نصيحة Moonlight</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed font-medium text-right">{aiInsights.proTip}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block text-right">أفضل حالات الاستخدام</span>
                    <div className="flex flex-wrap gap-3 justify-end">
                      {aiInsights.suggestedUseCases.map((useCase, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-xs text-gray-300 font-bold">
                          <CheckCircle2 size={14} className="text-primary" />
                          {useCase}
                        </div>
                      ))}
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
