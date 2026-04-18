import { useState } from 'react';
import { User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { loginWithGoogle } from '../lib/firebase';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, Loader2 } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';

interface LoginProps {
  user: User | null;
}

export default function Login({ user }: LoginProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" />;
  }

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      let message = t('auth.errorUnexpected');
      
      if (err.code === 'auth/popup-blocked') {
        message = t('auth.errorPopupBlocked');
      } else if (err.code === 'auth/unauthorized-domain') {
        message = t('auth.errorUnauthorizedDomain', { hostname: window.location.hostname });
      } else if (err.code === 'auth/network-request-failed') {
        message = t('auth.errorNetwork');
      } else if (err.message) {
        message = `${t('auth.loginFailed')}: ${err.message}`;
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden"
    >
      {/* Thematic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] -z-10" />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="magic-card p-10 md:p-14 rounded-[4rem] w-full max-w-md text-center space-y-12 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 blur-3xl -ml-16 -mt-16" />
        
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 w-32 h-32 rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-inner group transition-transform duration-700 hover:rotate-12">
            <LogIn className="text-primary group-hover:scale-110 transition-transform" size={54} />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tighter text-white animate-heartbeat-glow" style={{'--glow-color': 'var(--glow-blue)'} as React.CSSProperties}>{t('auth.welcome')}</h1>
          <p className="text-white/40 text-lg font-medium leading-relaxed">{t('auth.loginDesc')}</p>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] text-red-400 text-base font-black text-right shadow-2xl"
            >
              {error}
            </motion.div>
          )}
        </div>

        <button 
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full group relative flex items-center justify-center gap-6 bg-white text-dark py-7 rounded-[2rem] font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-white/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          {isLoading ? (
            <Loader2 className="animate-spin" size={32} />
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" className="w-8 h-8 group-hover:rotate-12 transition-transform" alt="Google" />
              {t('auth.googleLogin')}
            </>
          )}
        </button>

        <div className="pt-10 border-t border-white/5 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 text-white/40 text-xs font-black uppercase tracking-[0.3em]">
            <ShieldCheck size={16} className="text-green-500" />
            {t('auth.secureLogin')}
          </div>
          <Link to="/" className="text-[10px] text-white/20 hover:text-primary transition-colors font-black uppercase tracking-[0.5em]">{t('auth.backToHome')}</Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
