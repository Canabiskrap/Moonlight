import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
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
    <div className="max-w-5xl mx-auto py-10 px-4 md:px-0">
      <header className="mb-16 space-y-6">
        <div className="flex items-center gap-4 bg-primary/10 w-fit px-5 py-2 rounded-2xl border border-primary/20 text-primary animate-soft-pulse">
          <ShoppingBag size={24} />
          <span className="text-xs font-black uppercase tracking-[0.4em]">{t('myOrders.personalAccount')}</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
          {t('myOrders.purchasedOrders').split(' ')[0]} <span className="text-gold animate-heartbeat-glow inline-block" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>{t('myOrders.purchased')}</span>
        </h1>
        <p className="text-white/50 text-xl max-w-2xl font-medium leading-relaxed">
          {t('myOrders.description')}
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-6 glass-card rounded-[3rem]">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full shadow-[0_0_20px_rgba(56,189,248,0.3)]"
          />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm animate-pulse">{t('myOrders.loading')}</p>
        </div>
      ) : orders.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="magic-card p-16 md:p-24 text-center space-y-10 rounded-[4rem] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[120px] rounded-full -mr-32 -mt-32" />
          <div className="bg-white/5 w-28 h-28 rounded-full flex items-center justify-center mx-auto text-gray-700 border border-white/10 shadow-inner">
            <Package size={54} />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-black text-white">{t('myOrders.noOrders')}</h3>
            <p className="text-gray-500 text-lg max-w-sm mx-auto leading-relaxed">{t('myOrders.noOrdersDesc', { email: user.email })}</p>
          </div>
          <Link 
            to="/" 
            className="inline-flex items-center gap-4 bg-primary text-white px-10 py-6 rounded-[2rem] font-black hover:scale-105 transition-all shadow-2xl shadow-primary/30 active:scale-95 group"
          >
            <span className="text-lg">{t('myOrders.exploreStore')}</span>
            <ChevronLeft size={24} className={`${i18n.language === 'ar' ? '' : 'rotate-180'} group-hover:translate-x-1 transition-transform`} />
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-8">
          <AnimatePresence mode="popLayout">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                className="magic-card p-8 md:p-12 rounded-[3.5rem] hover:border-primary/40 transition-all group relative overflow-hidden backdrop-blur-3xl"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[100px] rounded-full -mr-24 -mt-24 group-hover:bg-primary/20 transition-all duration-700" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="flex items-start gap-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary border border-primary/20 flex-shrink-0 group-hover:rotate-12 transition-transform duration-500 shadow-2xl">
                      <Package size={36} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-4">
                        <h3 className="text-3xl font-black text-white group-hover:text-primary transition-colors animate-heartbeat-glow" style={{'--glow-color': 'var(--glow-gold)'} as React.CSSProperties}>{order.productName || order.serviceTitle}</h3>
                        {order.isTest && (
                          <span className="px-3 py-1 bg-gold/20 text-gold text-[10px] rounded-xl border border-gold/30 font-black tracking-widest uppercase">{t('myOrders.test')}</span>
                        )}
                      </div>
                      <p className="text-xs text-white/30 font-black uppercase tracking-[0.3em]">
                        {t('myOrders.orderNumber')}: <span className="text-white/60">MOON-{order.paypalOrderId?.slice(-10) || order.id.slice(-10)}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-6 mt-4">
                        <div className="flex items-center gap-2.5 text-xs font-black text-white/40 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                          <Clock size={14} className="text-primary" />
                          {order.createdAt?.toDate().toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className={`flex items-center gap-2.5 text-xs font-black px-4 py-2 rounded-xl border ${
                          order.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'bg-primary/10 text-primary border-primary/20 animate-pulse'
                        }`}>
                          {order.status === 'completed' ? <CheckCircle2 size={14} /> : <Clock size={14} className="animate-spin-slow" />}
                          {order.status === 'completed' ? t('myOrders.completedReady').toUpperCase() : t('myOrders.inProgress').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link 
                    to={`/order-portal/${order.id}`}
                    className="bg-white/5 hover:bg-primary hover:text-white border border-white/10 hover:border-primary px-10 py-6 rounded-[2rem] flex items-center justify-center gap-4 transition-all group/btn shadow-2xl relative overflow-hidden active:scale-95"
                  >
                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                    <span className="font-black text-lg tracking-tight relative z-10">{t('myOrders.openPortal')}</span>
                    <ExternalLink size={24} className="relative z-10 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-20 p-12 glass-card rounded-[4rem] flex flex-col md:flex-row items-center gap-12 border-white/5 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-primary/30 border border-white/10 group-hover:rotate-6 transition-all duration-700">
          <Search size={44} />
        </div>
        <div className="flex-1 text-center md:text-right space-y-3">
          <h3 className="text-3xl font-black text-white animate-heartbeat-glow leading-tight" style={{'--glow-color': 'var(--glow-gold)'} as React.CSSProperties}>{t('myOrders.lostAccess')}</h3>
          <p className="text-lg text-white/50 font-medium leading-relaxed">{t('myOrders.lostAccessDesc')}</p>
        </div>
        <Link 
          to="/recover-order"
          className="bg-white text-black px-10 py-6 rounded-[2rem] font-black hover:scale-105 transition-all flex items-center gap-4 shadow-2xl active:scale-95 group/btn"
        >
          <span className="text-lg">{t('myOrders.recoverLost')}</span>
          <ChevronLeft size={28} className={`${i18n.language === 'ar' ? '' : 'rotate-180'} group-hover/btn:translate-x-1 transition-transform`} />
        </Link>
      </motion.div>
    </div>
  );
}
