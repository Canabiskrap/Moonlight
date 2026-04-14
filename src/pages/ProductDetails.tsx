import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { convertDriveLink } from '../lib/utils';
import { motion } from 'motion/react';
import { ArrowRight, Download, ShieldCheck, Sparkles, ExternalLink, Brain, Target, Lightbulb, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { getProductInsights, ProductInsight } from '../services/geminiService';

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

  useEffect(() => {
    if (product && !paid && !loading) {
      const container = document.getElementById('paypal-button-container');
      if (container && container.innerHTML !== '') return; // Prevent double rendering

      const clientId = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID || 'AcbwuN16XVq7P_HKhjbHRTegmSRXI0DoFOoLw2pn-LilZUuf1FRl0v888wjPvs428lM5sdf97LUNcvT5';
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.async = true;
      script.onload = () => {
        if ((window as any).paypal) {
          (window as any).paypal.Buttons({
            createOrder: (data: any, actions: any) => {
              const priceValue = parseFloat(product.price).toFixed(2);
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: priceValue,
                    currency_code: 'USD'
                  },
                  description: product.name
                }]
              });
            },
            onApprove: async (data: any, actions: any) => {
              try {
                // We don't capture here, we just get the order ID and let the server verify it.
                // Wait, the client-side script usually captures it. Let's capture it here, then verify.
                const order = await actions.order.capture();
                console.log("Payment Success:", order);
                
                // Record order in Firestore
                const orderRef = await addDoc(collection(db, 'orders'), {
                  productId: product.id,
                  productName: product.name,
                  amount: product.price,
                  customerEmail: order.payer.email_address,
                  customerName: order.payer.name?.given_name || '',
                  paypalOrderId: order.id,
                  status: 'completed',
                  downloadUrl: product.downloadUrl,
                  createdAt: Timestamp.now()
                });

                setPaid(true);
                
                // Redirect to Order Portal after a short delay
                setTimeout(() => {
                  navigate(`/order-portal/${orderRef.id}`);
                }, 2000);
              } catch (err) {
                console.error("Error processing approved order:", err);
                alert("حدث خطأ أثناء معالجة الطلب. يرجى التواصل مع الدعم.");
              }
            },
            onError: (err: any) => {
              console.error("PayPal Error Details:", err);
              // Show a more helpful message if possible
              const errorMsg = err?.message || "حدث خطأ أثناء عملية الدفع. يرجى التأكد من اتصالك بالإنترنت أو المحاولة مرة أخرى.";
              alert(errorMsg);
            }
          }).render('#paypal-button-container');
        }
      };
      document.body.appendChild(script);
      return () => {
        const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
        if (existingScript) document.body.removeChild(existingScript);
      };
    }
  }, [product, paid, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold mr-4">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-40 space-y-6">
        <h2 className="text-3xl font-bold text-gray-400">{error || t('products.notFound')}</h2>
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowRight size={20} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
          {t('products.backToStore')}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="cosmic-bg" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-12 relative z-10"
      >
        {/* Image Side */}
        <div className="space-y-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-all mb-4 group">
            <ArrowRight size={18} className={`${i18n.language === 'ar' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} />
            <span className="font-bold">{t('products.backToStore')}</span>
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
            
            <div className="absolute top-8 right-8 z-20">
              <div className="gold-capsule text-sm px-6 py-2">${product.price}</div>
            </div>
          </div>
        </div>

        {/* Details Side */}
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
              <Zap size={12} />
              {t('products.premiumDigital')}
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter text-glow">{product.name}</h1>
            <p className="text-gray-400 text-xl leading-relaxed font-medium text-right">{product.description}</p>
          </div>

          <div className="glass-card p-10 rounded-[2.5rem] space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="flex items-center gap-4 text-green-400 bg-green-400/5 p-6 rounded-2xl border border-green-400/10">
              <ShieldCheck size={28} />
              <p className="font-bold text-sm leading-relaxed">{t('products.securePayment')}</p>
            </div>

            {!paid ? (
              <div className="space-y-6">
                <div id="paypal-button-container" className="min-h-[150px] relative z-10" />
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
                  <h3 className="text-3xl font-black text-white">{t('products.thanks')}</h3>
                  <p className="text-gray-400 font-medium">{t('products.paymentConfirmed')}</p>
                </div>
                <a 
                  href={product.downloadUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-premium flex items-center justify-center gap-3 bg-white text-black py-5 rounded-2xl font-black text-lg shadow-2xl shadow-white/10"
                >
                  {t('products.downloadFiles')}
                  <ExternalLink size={20} />
                </a>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl text-center space-y-1">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('products.category')}</p>
              <p className="font-black text-gold text-lg">{product.category}</p>
            </div>
            <div className="glass-card p-6 rounded-2xl text-center space-y-1">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('products.delivery')}</p>
              <p className="font-black text-green-400 text-lg">{t('products.instant')}</p>
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
                      <p className="text-lg font-black text-white">{t('products.aiInsights')}</p>
                      <p className="text-xs text-gray-500 font-medium">{t('products.aiInsightsDesc')}</p>
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
                  <h3 className="text-2xl font-black">{t('products.aiVision')}</h3>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gold">
                      <Brain size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">{t('products.creativeSummary')}</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed font-medium text-right">{aiInsights.creativeSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Target size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">{t('products.targetAudience')}</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed font-medium text-right">{aiInsights.targetAudience}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-400">
                        <Lightbulb size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">{t('products.proTip')}</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed font-medium text-right">{aiInsights.proTip}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block text-right">{t('products.bestUseCases')}</span>
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
      </motion.div>
    </div>
  );
}
