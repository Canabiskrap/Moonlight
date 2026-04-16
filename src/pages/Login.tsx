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
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-dark-light/40 backdrop-blur-2xl p-8 md:p-12 rounded-[3rem] border border-white/10 w-full max-w-md text-center space-y-10 shadow-2xl relative"
      >
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 w-24 h-24 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-inner">
            <LogIn className="text-primary" size={44} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tighter text-white">{t('auth.welcome')}</h1>
          <p className="text-gray-500 text-sm font-medium leading-relaxed">{t('auth.loginDesc')}</p>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-sm font-bold text-right"
            >
              {error}
            </motion.div>
          )}
        </div>

        <button 
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full group relative flex items-center justify-center gap-4 bg-white text-dark py-5 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all shadow-2xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          {isLoading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
              {t('auth.googleLogin')}
            </>
          )}
        </button>

        <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={14} className="text-green-500" />
            {t('auth.secureLogin')}
          </div>
          <Link to="/" className="text-[10px] text-gray-600 hover:text-primary transition-colors font-black uppercase tracking-widest">{t('auth.backToHome')}</Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
