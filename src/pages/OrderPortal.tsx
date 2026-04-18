import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Lock,
  RefreshCw,
  Sparkles,
  Loader2
} from 'lucide-react';

export default function OrderPortal() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const prevStatus = useRef<string | null>(null);

  const fallbackLogo = "https://i.ibb.co/6cJ5wS0h/nf9gthbcbxrmw0cxg8993rpk28-result-0.png";

  const verifyAndDownload = async () => {
    if (!order || isVerifying) return;
    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: order.paypalOrderId, 
          encryptedUrl: order.encryptedUrl,
          whatsappEnabled: whatsappEnabled,
          whatsappNumber: whatsappNumber
        })
      });

      if (!res.ok) {
        let errMsg = "Server error";
        const responseText = await res.text();
        try {
          const errData = JSON.parse(responseText);
          errMsg = errData.error || errMsg;
        } catch (e) {
          errMsg = responseText || errMsg;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
        window.open(data.downloadUrl, '_blank');
      } else {
        alert(t('orderPortal.verificationFailed') || "Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification Error:", err);
      // Show descriptive error if possible
      const baseMsg = t('orderPortal.verificationError');
      alert(`${baseMsg}\n\nDetails: ${err.message || 'Unknown'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    // Fetch Logo
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'appearance'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setLogoUrl(data.logoUrl || '');
          setWhatsappEnabled(data.whatsappNotificationsEnabled || false);
          setWhatsappNumber(data.whatsappNumber || '');
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
        setError(t('orderPortal.notFound'));
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError(t('orderPortal.errorLoading'));
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
        <h2 className="text-3xl font-black text-white">{error || t('orderPortal.notFound')}</h2>
        <p className="text-gray-500 max-w-md mx-auto">{t('orderPortal.checkLink')}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-bold">
          <ArrowLeft size={20} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
          {t('orderPortal.backToHome') || "العودة للرئيسية"}
        </Link>
      </div>
    );
  }

  const steps = [
    { id: 'payment', title: t('orderPortal.step1Title'), sub: t('orderPortal.step1Sub'), date: order.createdAt?.toDate().toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long' }) },
    { id: 'processing', title: t('orderPortal.step2Title'), sub: t('orderPortal.step2Sub'), date: t('orderPortal.orderInProgress') },
    { id: 'completed', title: t('orderPortal.step3Title'), sub: t('orderPortal.step3Sub'), date: '---' }
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

  const getProgressPercentage = () => {
    const status = order.status || 'pending';
    if (status === 'completed') return 100;
    if (status === 'processing') return 50;
    return 15;
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-primary selection:text-white pb-20 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] -ml-64 -mb-64" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Header - Removed since global Navbar is present */}

        {/* Hero Section */}
        <div className="py-12 space-y-4">
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-4 py-1.5 rounded-full text-[10px] font-black text-green-500 uppercase tracking-widest w-fit">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            {order.status === 'completed' ? t('orderPortal.completed') : t('orderPortal.orderInProgress')}
          </div>
          <span className="text-gold text-xs font-black uppercase tracking-[0.3em] block mt-4">{t('orderPortal.customerPortal')}</span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-7xl font-black leading-tight tracking-tighter"
          >
            {t('orderPortal.welcome')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-green-400 animate-gradient-x">
              {order.customerName || order.customerEmail?.split('@')[0] || t('orderPortal.friend')} 👋
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/60 text-lg md:text-xl font-medium max-w-2xl leading-relaxed"
          >
            {t('orderPortal.welcomeDesc')}
          </motion.p>
        </div>

        {/* Order Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="magic-card p-8 md:p-12 relative overflow-hidden group rounded-[3rem]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-primary/20 transition-all duration-700" />
          
          <div className="relative z-10 space-y-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <span className="text-xs font-black text-gold uppercase tracking-[0.3em]">{t('orderPortal.orderDetails')}</span>
              <span className="text-base font-mono text-gold font-black bg-gold/10 px-4 py-2 rounded-2xl border border-gold/20 shadow-[0_0_20px_rgba(255,215,0,0.15)] animate-pulse">
                ID-{order.paypalOrderId?.slice(-10) || order.id.slice(-10)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-2 border-r-2 border-white/5 pr-6">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">{t('orderPortal.productService')}</span>
                  <div className="text-2xl md:text-3xl font-black text-white animate-heartbeat-glow leading-tight" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>
                    {order.productName || order.serviceTitle}
                  </div>
                </div>
                <div className="space-y-2 border-r-2 border-white/5 pr-6">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">{t('orderPortal.orderDate')}</span>
                  <div className="text-lg font-bold text-white/90">
                    {order.createdAt?.toDate().toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="space-y-2 border-r-2 border-white/5 pr-6">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">{t('orderPortal.paymentStatus')}</span>
                  <div className="text-lg font-bold text-green-400 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                    {t('orderPortal.paidSuccess')}
                  </div>
                </div>
                <div className="space-y-2 border-r-2 border-white/5 pr-6">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">{t('orderPortal.totalAmount')}</span>
                  <div className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                    ${order.amount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Tracker */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-12 glass-card p-10 md:p-14 rounded-[3rem]"
        >
          <div className="flex items-center justify-between mb-10">
            <span className="text-xs font-black text-gold uppercase tracking-[0.3em]">{t('orderPortal.stages')}</span>
            <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-xs font-black text-primary tracking-widest">{getProgressPercentage()}% COMPLETED</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-4 bg-white/5 rounded-full mb-14 overflow-hidden shadow-inner border border-white/5">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary via-purple-500 to-green-400 shadow-[0_0_20px_rgba(56,189,248,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 2, ease: "circOut" }}
            />
          </div>
          
          <div className="space-y-0 relative">
            {steps.map((step, idx) => {
              const status = getStepStatus(step.id);
              const stepColors = {
                payment: { active: '#38BDF8', done: '#22c55e', bg: 'rgba(56, 189, 248, 0.2)' },
                processing: { active: '#A855F7', done: '#A855F7', bg: 'rgba(168, 85, 247, 0.2)' },
                completed: { active: '#4ADE80', done: '#4ADE80', bg: 'rgba(74, 222, 128, 0.2)' }
              }[step.id as 'payment' | 'processing' | 'completed'];

              return (
                <div key={step.id} className="flex gap-6 relative pb-10 last:pb-0">
                  {idx !== steps.length - 1 && (
                    <div className={`absolute right-[17px] top-10 bottom-0 w-0.5 ${status === 'done' ? 'bg-primary' : 'bg-white/10'}`} />
                  )}
                  
                  <motion.div 
                    initial={false}
                    animate={{
                      backgroundColor: status === 'done' ? stepColors.done : status === 'active' ? stepColors.active : '#1f2937',
                      borderColor: status === 'done' ? stepColors.done : status === 'active' ? stepColors.active : '#374151',
                      scale: status === 'active' ? 1.2 : 1,
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-500 border-2 relative ${
                      status === 'done' ? 'text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' :
                      status === 'active' ? 'text-white shadow-[0_0_30px_rgba(168,85,247,0.4)]' :
                      'text-white/20'
                    }`}
                  >
                    {status === 'active' && (
                      <motion.div 
                        layoutId="active-glow"
                        className="absolute inset-0 rounded-full blur-md opacity-50"
                        style={{ backgroundColor: stepColors.active }}
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <div className="relative z-10">
                      {status === 'done' ? <CheckCircle2 size={18} /> : 
                       status === 'active' ? (
                         step.id === 'payment' ? <CreditCard size={18} /> :
                         step.id === 'processing' ? <RefreshCw size={18} className="animate-spin" /> :
                         <Sparkles size={18} className="animate-pulse" />
                       ) : 
                       <span className="text-xs font-black">{idx + 1}</span>}
                    </div>
                  </motion.div>

                  <div className="flex-1 pt-1">
                    <h3 className={`font-black text-lg transition-colors duration-500 ${status === 'pending' ? 'text-white/20' : 'text-white'}`}>{step.title}</h3>
                    <p className="text-sm text-white/40 font-medium mt-1">{step.sub}</p>
                    {status === 'done' && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[10px] text-green-400 font-black mt-2 flex items-center gap-2 tracking-widest uppercase"
                      >
                        <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" />
                        ✓ {t('orderPortal.completed')} — {step.date}
                      </motion.span>
                    )}
                    {status === 'active' && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10px] text-primary font-black mt-2 flex items-center gap-2 tracking-widest uppercase animate-pulse"
                      >
                        <Zap size={10} className="fill-primary" />
                        {t('orderPortal.orderInProgress')}
                      </motion.span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Downloads & Files */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 magic-card p-10 md:p-14 rounded-[3rem] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="flex items-center justify-between mb-10">
            <span className="text-xs font-black text-green-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Zap size={14} className="animate-pulse" />
              </div>
              {t('orderPortal.readyFiles')}
            </span>
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t('orderPortal.liveSync')}</span>
            </div>
          </div>
          
          <div className="space-y-8">
            {order.status === 'completed' ? (
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-10"
              >
                <div className="bg-white/5 border border-white/10 p-12 rounded-[2.5rem] flex flex-col items-center text-center space-y-6 relative overflow-hidden group transition-all hover:bg-white/[0.08]">
                  <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="w-32 h-32 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-[2rem] flex items-center justify-center text-green-400 shadow-2xl border border-green-500/20 relative z-10 transition-transform duration-700 group-hover:rotate-12">
                    <Package size={64} className="group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  
                  <div className="relative z-10 space-y-3">
                    <h4 className="text-3xl font-black text-white animate-heartbeat-glow" style={{ '--glow-color': '#10b981' } as React.CSSProperties}>{t('orderPortal.finalFile')}</h4>
                    <p className="text-gray-400 font-medium text-lg leading-relaxed">{t('orderPortal.readyForUse')}</p>
                  </div>
                </div>

                {/* Personalized Thank You Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-gradient-to-br from-primary/10 via-purple-500/5 to-dark-light p-10 rounded-[3rem] border border-white/10 text-center space-y-6 shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="text-6xl animate-bounce">✨</div>
                  <h3 className="text-3xl font-black text-white tracking-tight">شكراً لثقتك بنا!</h3>
                  <p className="text-lg text-white/70 leading-relaxed">نحن فخورون جداً بأنك اخترت <span className="text-primary font-black drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">Moonlight 🌕</span>. نتمنى أن تنال خدمتنا إعجابك.</p>
                </motion.div>

                <motion.button 
                  onClick={verifyAndDownload}
                  disabled={isVerifying}
                  whileHover={{ scale: 1.02, translateY: -8, boxShadow: "0 25px 50px -12px rgba(34, 197, 94, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-10 bg-gradient-to-r from-green-600 via-green-500 to-green-400 text-black rounded-[2.5rem] flex items-center justify-center gap-6 shadow-[0_20px_60px_rgba(34,197,94,0.4)] group transition-all disabled:opacity-50 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="text-3xl font-black tracking-tighter relative z-10">
                    {isVerifying ? (
                      <Loader2 className="animate-spin" size={36} />
                    ) : (
                      downloadUrl ? t('orderPortal.downloadAgain') : t('orderPortal.downloadNow')
                    )}
                  </span>
                  {!isVerifying && <Download size={36} className="relative z-10 group-hover:translate-y-1 transition-transform" />}
                </motion.button>
                
                <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center justify-center gap-3">
                  <ShieldCheck size={14} className="text-green-500" />
                  {t('orderPortal.secureLink')}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-8">
                <div className="bg-black/40 border border-dashed border-white/10 p-16 rounded-[2.5rem] text-center space-y-8 grayscale-[0.5] opacity-80 group">
                  <div className="w-28 h-28 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-500 relative border border-white/5">
                    <Lock size={40} className="group-hover:rotate-12 transition-transform duration-500" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-[-8px] border-2 border-dashed border-white/10 rounded-full"
                    />
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-2xl font-black text-gray-400">{t('orderPortal.filesProcessing')}</h4>
                    <p className="text-lg text-gray-600 font-medium max-w-sm mx-auto leading-relaxed">{t('orderPortal.processingDesc')}</p>
                  </div>
                </div>
                
                <div className="w-full py-10 bg-white/5 border border-white/10 text-white/20 rounded-[2.5rem] flex items-center justify-center gap-6 cursor-not-allowed">
                  <span className="text-2xl font-black tracking-tighter">{t('orderPortal.linkLocked')}</span>
                  <Lock size={32} />
                </div>
                
                <p className="text-center text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 animate-pulse">
                  <Clock size={16} />
                  {t('orderPortal.linkWillOpen')}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 glass-card p-10 md:p-14 rounded-[3rem] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -ml-16 -mt-16" />
          <span className="text-xs font-black text-gold uppercase tracking-[0.3em] block mb-10">{t('orderPortal.instructions')}</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 italic">
            {[
              t('orderPortal.instruction1'),
              t('orderPortal.instruction2'),
              t('orderPortal.instruction3'),
              t('orderPortal.instruction4')
            ].map((text, i) => (
              <div key={i} className="flex gap-6 items-start group">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-xs font-black text-primary flex-shrink-0 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300">
                  0{i + 1}
                </div>
                <p className="text-base text-white/50 font-medium leading-relaxed group-hover:text-white/80 transition-colors">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Support Card */}
        <motion.button 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          onClick={() => window.open('https://www.instagram.com/moonlight_eb.kw?igsh=czYzc2thY3p5NGs2', '_blank')}
          className="mt-12 w-full magic-card p-10 flex flex-col md:flex-row items-center gap-8 hover:border-primary/50 transition-all group text-right shadow-2xl rounded-[3rem] relative overflow-hidden"
        >
          <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 border border-primary/30 shadow-2xl shadow-primary/20">
            <MessageSquare size={40} />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-3xl font-black text-white animate-heartbeat-glow" style={{ '--glow-color': 'var(--glow-gold)' } as React.CSSProperties}>{t('orderPortal.contactMoonlight')}</h3>
            <p className="text-lg text-white/60 font-medium">{t('orderPortal.haveQuestion')}</p>
          </div>
          <motion.div
            animate={{ x: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronLeft className={`${i18n.language === 'ar' ? '' : 'rotate-180'} text-primary/40 group-hover:text-primary transition-colors`} size={40} />
          </motion.div>
        </motion.button>

        {/* Footer */}
        <footer className="mt-20 text-center space-y-4 opacity-50">
          <p className="text-xs font-medium text-gray-500">{t('orderPortal.madeBy')} <span className="text-primary font-black">Moonlight 🌕</span></p>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black">{t('orderPortal.allRights')}</p>
        </footer>
      </div>
    </div>
  );
}
