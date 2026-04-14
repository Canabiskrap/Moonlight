import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  ShoppingBag, 
  Mail, 
  RefreshCw, 
  MessageCircle, 
  Lock,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BuyerProtection() {
  const { t, i18n } = useTranslation();
  const protocols = [
    {
      icon: <ShoppingBag className="text-primary" size={32} />,
      title: t('protection.protocols.0.title'),
      desc: t('protection.protocols.0.desc'),
      details: [
        t('protection.protocols.0.details.0'),
        t('protection.protocols.0.details.1')
      ]
    },
    {
      icon: <Lock className="text-primary" size={32} />,
      title: t('protection.protocols.1.title'),
      desc: t('protection.protocols.1.desc'),
      details: [
        t('protection.protocols.1.details.0'),
        t('protection.protocols.1.details.1')
      ]
    },
    {
      icon: <RefreshCw className="text-primary" size={32} />,
      title: t('protection.protocols.2.title'),
      desc: t('protection.protocols.2.desc'),
      details: [
        t('protection.protocols.2.details.0')
      ]
    },
    {
      icon: <MessageCircle className="text-primary" size={32} />,
      title: t('protection.protocols.3.title'),
      desc: t('protection.protocols.3.desc'),
      details: [
        t('protection.protocols.3.details.0')
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-10">
      <header className="text-center mb-20 space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-primary/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-2xl shadow-primary/10"
        >
          <ShieldCheck className="text-primary" size={48} />
        </motion.div>
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-primary-light mx-auto">
          {t('protection.header.badge')}
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter">
          {t('protection.header.title')} <br />
          <span className="text-gold">{t('protection.header.titleAccent')}</span>
        </h1>
        <p className="text-gray-500 text-xl max-w-2xl mx-auto leading-relaxed">
          {t('protection.header.description')}
        </p>
      </header>

      <div className="grid gap-8">
        {protocols.map((p, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10">
                {p.icon}
              </div>
              <div className="space-y-6 flex-1">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gold group-hover:text-white transition-colors duration-500">{p.title}</h3>
                  <p className="text-gray-400 font-medium text-lg leading-relaxed">{p.desc}</p>
                </div>
                <ul className="space-y-3">
                  {p.details.map((detail, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gold font-black leading-relaxed bg-gold/5 p-4 rounded-2xl border border-gold/10">
                      <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0 animate-pulse" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 rounded-[3rem] p-10 md:p-16 text-center space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        
        <div className="space-y-4 relative z-10">
          <h2 className="text-3xl font-black text-white">{t('protection.advice.title')}</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('protection.advice.desc')}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 relative z-10">
          <Link 
            to="/my-orders"
            className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform flex items-center gap-2 shadow-xl shadow-primary/20"
          >
            {t('protection.advice.buttonOrders')}
            <ChevronLeft className={i18n.language === 'ar' ? '' : 'rotate-180'} size={24} />
          </Link>
          <Link 
            to="/"
            className="bg-white/5 hover:bg-white/10 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center gap-2 border border-white/10"
          >
            {t('protection.advice.buttonHome')}
            <ArrowRight className={i18n.language === 'ar' ? '' : 'rotate-180'} size={24} />
          </Link>
        </div>

        <p className="text-primary font-black text-xl pt-4">{t('protection.advice.footer')}</p>
      </div>
    </div>
  );
}
