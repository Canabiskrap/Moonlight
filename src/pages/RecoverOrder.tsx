import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Mail, 
  Hash, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function RecoverOrder() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // We search for orders matching the email
      const q = query(
        collection(db, 'orders'),
        where('customerEmail', '==', email.trim().toLowerCase())
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError(t('recovery.notFound'));
      } else {
        // Find the specific order by ID (either full ID or last 8 chars of PayPal ID)
        const foundOrder = snapshot.docs.find(doc => {
          const data = doc.data();
          const cleanOrderId = orderId.trim().toLowerCase().replace('#', '');
          return doc.id === cleanOrderId || 
                 data.paypalOrderId?.toLowerCase().endsWith(cleanOrderId) ||
                 doc.id.endsWith(cleanOrderId);
        });

        if (foundOrder) {
          setResult({ id: foundOrder.id, ...foundOrder.data() });
        } else {
          setError(t('recovery.wrongData'));
        }
      }
    } catch (err) {
      console.error("Recovery error:", err);
      setError(t('recovery.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <header className="text-center mb-12 space-y-4">
        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
          <ShieldCheck className="text-primary" size={40} />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter">{t('recovery.recoverAccess')}</h1>
        <p className="text-gray-500 font-medium">{t('recovery.description')}</p>
      </header>

      <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl rounded-full -mr-20 -mt-20" />
        
        <form onSubmit={handleRecover} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Mail size={14} />
              {t('recovery.emailLabel')}
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-700 focus:border-primary/50 focus:bg-white/[0.08] outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} />
              {t('recovery.orderIdLabel')}
            </label>
            <input 
              type="text" 
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="#12345678"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-700 focus:border-primary/50 focus:bg-white/[0.08] outline-none transition-all font-mono"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Search size={22} />
                {t('recovery.searchButton')}
              </>
            )}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4"
            >
              <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-sm text-red-200 font-medium leading-relaxed">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 p-8 bg-green-500/10 border border-green-500/20 rounded-3xl space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="font-black text-white">{t('recovery.found')}</h3>
                  <p className="text-xs text-green-400/70 font-bold uppercase tracking-widest">#{result.id.slice(-8)} · {result.productName || result.serviceTitle}</p>
                </div>
              </div>

              <button 
                onClick={() => navigate(`/order-portal/${result.id}`)}
                className="w-full bg-green-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
              >
                {t('recovery.openPortal')}
                <ExternalLink size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold">
          <ArrowLeft size={18} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
          {t('common.back')}
        </Link>
      </div>
    </div>
  );
}
