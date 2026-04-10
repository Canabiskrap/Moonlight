import { useState } from 'react';
import { User } from 'firebase/auth';
import { loginWithGoogle } from '../lib/firebase';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface LoginProps {
  user: User | null;
}

export default function Login({ user }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return <Navigate to="/" />;
  }

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      // Handle specific Firebase errors
      if (err.code === 'auth/popup-blocked') {
        alert("تم حظر النافذة المنبثقة. يرجى السماح بالمنبثقات لهذا الموقع أو المحاولة من متصفح آخر.");
      } else if (err.code === 'auth/unauthorized-domain') {
        alert("هذا النطاق (Domain) غير مصرح به في إعدادات Firebase. يرجى إضافة رابط الموقع إلى Authorized Domains في Firebase Console.");
      } else {
        alert(`فشل تسجيل الدخول: ${err.message || "خطأ غير معروف"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-dark-light p-8 md:p-10 rounded-[2.5rem] border border-white/5 w-full max-w-md text-center space-y-8 shadow-2xl shadow-black/50"
      >
        <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border border-primary/20">
          <LogIn className="text-primary" size={40} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black">تسجيل الدخول</h1>
          <p className="text-gray-500">سجل دخولك للوصول إلى لوحة التحكم أو متابعة مشترياتك</p>
        </div>

        <button 
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-4 bg-white text-dark py-4 rounded-2xl font-black text-lg hover:bg-gray-200 transition-all shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
              الدخول بواسطة جوجل
            </>
          )}
        </button>

        <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-gray-600 text-sm">
          <ShieldCheck size={16} />
          دخول آمن ومحمي
        </div>
      </motion.div>
    </div>
  );
}
