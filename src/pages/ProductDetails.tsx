import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Download, ExternalLink, CreditCard } from 'lucide-react';

declare global {
  interface Window {
    paypal: any;
  }
}

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=AcbwuN16XVq7P_HKhjbHRTegmSRXI0DoFOoLw2pn-LilZUuf1FRl0v888wjPvs428lM5sdf97LUNcvT5&currency=USD`;
      script.async = true;
      script.onload = () => {
        if (window.paypal) {
          window.paypal.Buttons({
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
        
        <div className="rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl shadow-black/50 aspect-video bg-dark-light flex items-center justify-center">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
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
            <span className="text-gray-500 font-bold">السعر</span>
            <span className="text-4xl font-black text-gold">${product.price}</span>
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
      </div>
    </motion.div>
  );
}
