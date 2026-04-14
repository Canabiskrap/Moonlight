import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  ChevronLeft, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  Search,
  ShoppingBag
} from 'lucide-react';

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // We query orders where customerEmail matches the user's email
    // This allows users to see orders even if they weren't logged in during purchase, 
    // as long as they use the same email.
    const q = query(
      collection(db, 'orders'),
      where('customerEmail', '==', user.email),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <header className="mb-12 space-y-4">
        <div className="flex items-center gap-3 text-primary mb-2">
          <ShoppingBag size={24} />
          <span className="text-xs font-black uppercase tracking-[0.3em]">حسابي الشخصي</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
          طلباتي <span className="text-gold">المشتراة</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl">
          هنا تجد جميع مشترياتك السابقة من Moonlight. يمكنك الوصول إلى بوابات التحميل الخاصة بك في أي وقت.
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
          />
          <p className="text-gray-500 font-bold">جاري تحميل طلباتك...</p>
        </div>
      ) : orders.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-16 text-center space-y-6"
        >
          <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-gray-600">
            <Package size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">لا توجد طلبات بعد</h3>
            <p className="text-gray-500 max-w-xs mx-auto">يبدو أنك لم تقم بأي عملية شراء باستخدام هذا البريد الإلكتروني ({user.email}).</p>
          </div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black hover:scale-105 transition-transform shadow-xl shadow-primary/20"
          >
            استكشف المتجر الآن
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 hover:border-primary/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 flex-shrink-0">
                      <Package size={28} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-white">{order.productName || order.serviceTitle}</h3>
                        {order.isTest && (
                          <span className="px-2 py-0.5 bg-gold/20 text-gold text-[8px] rounded-md border border-gold/30 font-black">تجريبي</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                        رقم الطلب: #{order.paypalOrderId?.slice(-8) || order.id.slice(-8)}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400">
                          <Clock size={12} />
                          {order.createdAt?.toDate().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className={`flex items-center gap-1.5 text-[10px] font-black ${
                          order.status === 'completed' ? 'text-green-400' : 'text-primary'
                        }`}>
                          {order.status === 'completed' ? <CheckCircle2 size={12} /> : <Clock size={12} className="animate-spin-slow" />}
                          {order.status === 'completed' ? 'مكتمل وجاهز' : 'جاري التجهيز'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link 
                    to={`/order-portal/${order.id}`}
                    className="bg-white/5 hover:bg-primary hover:text-white border border-white/10 hover:border-primary px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group/btn"
                  >
                    <span className="font-black text-sm">فتح البوابة</span>
                    <ExternalLink size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-20 p-8 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Search size={32} />
        </div>
        <div className="flex-1 text-center md:text-right space-y-2">
          <h3 className="text-xl font-black text-white">هل فقدت الوصول لطلب معين؟</h3>
          <p className="text-sm text-gray-400 font-medium">إذا قمت بشراء منتج ببريد إلكتروني مختلف، يمكنك استعادته يدوياً.</p>
        </div>
        <Link 
          to="/recover-order"
          className="bg-white text-black px-8 py-4 rounded-2xl font-black hover:scale-105 transition-transform flex items-center gap-2"
        >
          استعادة طلب مفقود
          <ChevronLeft size={20} />
        </Link>
      </div>
    </div>
  );
}
