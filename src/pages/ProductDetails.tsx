import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { convertDriveLink } from '../lib/utils';
import { motion } from 'motion/react';
import { ArrowRight, Download, ShieldCheck, Sparkles, ExternalLink, Brain, Target, Lightbulb, CheckCircle2, Loader2 } from 'lucide-react';
import { getProductInsights, ProductInsight } from '../services/geminiService';

export default function ProductDetails() {
  const { id } = useParams();
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
          setError("المنتج غير موجود");
        }
      } catch (err) {
        console.error(err);
        setError("خطأ في تحميل المنتج");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && !paid && !loading) {
      const clientId = (import.meta as any).env.VITE_PAYPAL_CLIENT_ID || 'AcbwuN16XVq7P_HKhjbHRTegmSRXI0DoFOoLw2pn-LilZUuf1FRl0v888wjPvs428lM5sdf97LUNcvT5';
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.async = true;
      script.onload = () => {
        if ((window as any).paypal) {
          (window as any).paypal.Buttons({
            createOrder: (data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: product.price.toString(),
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
                await addDoc(collection(db, 'orders'), {
                  productId: product.id,
                  productName: product.name,
                  amount: product.price,
                  customerEmail: order.payer.email_address,
                  paypalOrderId: order.id,
                  status: 'completed',
                  createdAt: Timestamp.now()
                });

                setPaid(true);
                
                // Verify with server and get decrypted download URL
                if (product.downloadUrl) {
                  const verifyRes = await fetch('/api/verify-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      orderId: order.id,
                      encryptedUrl: product.downloadUrl
                    })
                  });

                  if (verifyRes.ok) {
                    const { downloadUrl } = await verifyRes.json();
                    if (downloadUrl) {
                      // Update the product state with the decrypted URL so the button works
                      setProduct(prev => ({ ...prev, downloadUrl }));
                      
                      // Auto trigger download
                      const link = document.createElement('a');
                      link.href = downloadUrl;
                      link.target = '_blank';
                      link.download = product.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  } else {
                    console.error("Server verification failed, falling back to original URL");
                    // Fallback for legacy unencrypted URLs if server fails
                    const link = document.createElement('a');
                    link.href = product.downloadUrl;
                    link.target = '_blank';
                    link.download = product.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }
              } catch (err) {
                console.error("Error processing approved order:", err);
                alert("حدث خطأ أثناء معالجة الطلب. يرجى التواصل مع الدعم.");
              }
            },
            onError: (err: any) => {
              console.error("PayPal Error:", err);
              alert("حدث خطأ أثناء عملية الدفع. يرجى المحاولة مرة أخرى.");
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
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-40 space-y-6">
        <h2 className="text-3xl font-bold text-gray-400">{error || "عذراً، لم نتمكن من العثور على المنتج"}</h2>
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowRight size={20} />
          العودة للمتجر
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-8"
    >
      {/* Image Side */}
      <div className="space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4">
          <ArrowRight size={18} />
          العودة للمتجر
        </Link>
        
        <div className="rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl shadow-black/50 aspect-video bg-dark-light flex items-center justify-center group relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
          <img 
            src={convertDriveLink(product.imageUrl)} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
            }}
          />
        </div>
      </div>

      {/* Details Side */}
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black">{product.name}</h1>
          <p className="text-gray-400 text-lg leading-relaxed">{product.description}</p>
        </div>

        <div className="bg-dark-light p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">السعر الحالي</span>
            <div className="relative">
              <span className="text-4xl font-black text-gold tracking-tighter drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">${product.price}</span>
              <Sparkles className="absolute -top-2 -right-4 text-gold/40 animate-pulse" size={14} />
            </div>
          </div>

          <div className="flex items-center gap-3 text-green-400 bg-green-400/10 p-4 rounded-2xl border border-green-400/20">
            <ShieldCheck size={24} />
            <span className="font-bold text-sm">دفع آمن ومحمي عبر PayPal. ستحصل على رابط التحميل فوراً بعد الدفع.</span>
          </div>

          {!paid ? (
            <div className="space-y-4">
              <div id="paypal-button-container" className="min-h-[150px]" />
              <div className="text-center text-xs text-gray-600">
                بالضغط على شراء، أنت توافق على شروط الخدمة وسياسة الاسترداد.
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-primary/10 border border-primary/30 p-8 rounded-2xl text-center space-y-6"
            >
              <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
                <Download className="text-white" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">تم الشراء بنجاح!</h3>
                <p className="text-gray-400">يمكنك الآن تحميل ملفات المنتج مباشرة</p>
              </div>
              <a 
                href={product.downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-xl font-black text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/20"
              >
                تحميل المنتج الآن
                <ExternalLink size={20} />
              </a>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
            <p className="text-xs text-gray-500 mb-1">الفئة</p>
            <p className="font-bold text-primary">
              {product.category === 'cv' ? 'سيرة ذاتية' : product.category === 'social' ? 'سوشيال ميديا' : 'قالب ويب'}
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
            <p className="text-xs text-gray-500 mb-1">التسليم</p>
            <p className="font-bold text-green-400">فوري وآلي</p>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="space-y-6">
          {!aiInsights ? (
            <button
              onClick={handleGetAiInsights}
              disabled={loadingAi}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary/20 to-gold/20 hover:from-primary/30 hover:to-gold/30 p-6 rounded-[2rem] border border-white/10 transition-all group disabled:opacity-50"
            >
              {loadingAi ? (
                <Loader2 className="animate-spin text-primary" size={24} />
              ) : (
                <>
                  <Brain className="text-primary group-hover:scale-110 transition-transform" size={24} />
                  <div className="text-right">
                    <p className="text-sm font-black text-white">رؤية الذكاء الاصطناعي</p>
                    <p className="text-[10px] text-gray-400">احصل على تحليل ذكي لهذا المشروع</p>
                  </div>
                </>
              )}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-light/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-primary/20 space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -ml-16 -mt-16" />
              
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <Sparkles className="text-primary" size={20} />
                </div>
                <h3 className="text-xl font-black text-white">تحليل Moonlight الذكي</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gold">
                    <Brain size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">خلاصة إبداعية</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed font-medium">{aiInsights.creativeSummary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Target size={16} />
                      <span className="text-xs font-black uppercase tracking-widest">الفئة المستهدفة</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">{aiInsights.targetAudience}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400">
                      <Lightbulb size={16} />
                      <span className="text-xs font-black uppercase tracking-widest">نصيحة الخبير</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">{aiInsights.proTip}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">حالات الاستخدام المثالية</span>
                  <div className="flex flex-wrap gap-2">
                    {aiInsights.suggestedUseCases.map((useCase, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-[10px] text-gray-300 font-bold">
                        <CheckCircle2 size={12} className="text-primary" />
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
  );
}
